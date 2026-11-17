import assert from 'node:assert/strict'
import { test } from 'node:test'
import { difficultyScore, generateMaze } from '../src/maze/generator.ts'
import { levels, sizes } from '../src/maze/model.ts'
import { complete, decodeSession, encodeSession, hintMaze, moveMaze, startMaze } from '../src/maze/session.ts'
import { canMove, neighbors, solveMaze, step, verifyMaze } from '../src/maze/solver.ts'
import { openSlot } from '../src/storage.ts'

const easy = { size: 13, level: 'easy' }

test('all sizes and levels produce deterministic, connected trees with one verified path', () => {
  for (const size of sizes) {
    for (const level of Object.keys(levels)) {
      const config = { size, level }
      const puzzle = generateMaze(config, 0)
      assert.deepEqual(puzzle, generateMaze(config, 0))
      assert.equal(puzzle.width, size)
      assert.equal(puzzle.open.reduce((a, b) => a + b), 2 * ((size - 1) / 2) ** 2 - 1)
      assert.deepEqual(verifyMaze(puzzle), { metrics: puzzle.metrics, solution: puzzle.solution })
      assert.deepEqual(solveMaze(puzzle, puzzle.start, puzzle.goal), puzzle.solution)
      assert.equal(puzzle.solution[0], puzzle.start)
      assert.equal(puzzle.solution.at(-1), puzzle.goal)
      assert.ok(puzzle.solution.slice(1).every((cell, i) => canMove(puzzle, puzzle.solution[i], cell)))
      assert.ok(puzzle.metrics.deadEnds > 0 && puzzle.metrics.junctions > 0 && puzzle.metrics.turns >= 4)
    }
  }
})

test('12 seeds at every size vary the maze and sort by difficulty within the same seed', () => {
  for (const size of sizes) {
    const unique = new Set()
    let easySteps = 0
    let hardSteps = 0
    for (let seed = 0; seed < 12; seed++) {
      const mazes = Object.keys(levels).map((level) => generateMaze({ size, level }, seed))
      const scores = mazes.map(({ metrics }) => difficultyScore(metrics, size))
      assert.ok(scores[0] <= scores[1] && scores[1] <= scores[2])
      assert.notEqual(scores[0], scores[2])
      assert.ok(mazes.every(({ metrics }) => metrics.turns >= 4 && metrics.branchDepth > 0))
      easySteps += mazes[0].metrics.steps
      hardSteps += mazes[2].metrics.steps
      unique.add(mazes[1].open.join(''))
    }
    assert.equal(unique.size, 12)
    assert.ok(hardSteps > easySteps)
  }
})

test('verifier rejects a disconnected, malformed or cyclic maze', () => {
  const puzzle = generateMaze(easy, 5)
  const open = puzzle.open.slice()
  const gap = puzzle.solution[1]
  open[gap] = 0
  assert.equal(verifyMaze({ ...puzzle, open }), null)
  open[gap] = 1
  const closedGap = open.findIndex((value, i) => {
    const row = Math.floor(i / puzzle.width)
    const col = i % puzzle.width
    return !value && row > 0 && col > 0 && row < puzzle.width - 1 && col < puzzle.width - 1 && row % 2 !== col % 2
  })
  assert.notEqual(closedGap, -1)
  open[closedGap] = 1
  assert.equal(verifyMaze({ ...puzzle, open }), null)
  assert.equal(verifyMaze({ ...puzzle, goal: puzzle.start }), null)
})

test('moves refuse walls, diagonals and jumps; a hint from a wrong branch gives only the next direction', () => {
  const puzzle = generateMaze(easy, 13)
  const initial = startMaze(puzzle)
  for (const cell of [-1, 0, puzzle.start + puzzle.width + 1, puzzle.solution[2]]) {
    assert.equal(moveMaze(initial, cell), initial)
  }
  const fork = puzzle.solution.find((cell) => neighbors(puzzle, cell).some((near) => !puzzle.solution.includes(near)))
  const side = neighbors(puzzle, fork).find((cell) => !puzzle.solution.includes(cell))
  const branch = [...puzzle.solution.slice(1, puzzle.solution.indexOf(fork) + 1), side].reduce(moveMaze, initial)
  assert.equal(branch.play.position, side)
  assert.equal(step(puzzle, side, hintMaze(branch)), fork)
})

test('completion locks movement without personal results or timing', () => {
  const puzzle = generateMaze(easy, 3)
  const finished = puzzle.solution.slice(1).reduce(moveMaze, startMaze(puzzle))
  assert.ok(complete(finished))
  assert.equal(moveMaze(finished, puzzle.solution.at(-2)), finished)
  assert.equal(hintMaze(finished), undefined)
  assert.deepEqual(Object.keys(encodeSession(finished)).sort(), ['config', 'id', 'position', 'revision', 'seed', 'visited'])
})

test('reload restores exact maze, position and trail; invalid history cannot become a playable session', () => {
  const data = new Map()
  const getStorage = () => ({
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  })
  const puzzle = generateMaze({ size: 61, level: 'hard' }, 17)
  const play = puzzle.solution.slice(1, 6).reduce(moveMaze, startMaze(puzzle))
  const slot = openSlot(getStorage, 'maze', decodeSession, encodeSession)
  assert.ok(slot.save(play))
  assert.deepEqual(openSlot(getStorage, 'maze', decodeSession, encodeSession).value, play)
  const entry = encodeSession(play)
  assert.equal(decodeSession({ ...entry, visited: [puzzle.start, entry.position] }), null)
  assert.equal(decodeSession({ ...entry, visited: [puzzle.start, puzzle.solution[1], puzzle.solution[1]] }), null)
  assert.equal(decodeSession({ ...entry, id: 'old-id' }), null)
})
