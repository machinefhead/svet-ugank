import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { difficultyScore, generateMaze } from '../src/maze/generator.ts'
import { levels, sizes } from '../src/maze/model.ts'
import { hintMaze, moveMaze, recordMazeResult, restartMaze, startMaze } from '../src/maze/session.ts'
import { canMove, measureMaze, neighbors, solveMaze } from '../src/maze/solver.ts'
import { mazeStorageKey, openMazeData } from '../src/maze/storage.ts'
import { storageKey } from '../src/storage.ts'

const easy = { size: 6, level: 'easy' }
const fingerprint = (puzzle) => createHash('sha256').update(puzzle.open).digest('hex')

test('all sizes and levels produce deterministic, connected trees with a verified unique path', () => {
  for (const size of sizes) {
    for (const level of Object.keys(levels)) {
      const config = { size, level }
      const puzzle = generateMaze(config, 42)
      assert.equal(puzzle.width, 2 * size + 1)
      assert.equal(puzzle.puzzleId, `labirint-r1-${size}-${level}-42`)
      assert.deepEqual(puzzle, generateMaze(config, 42, 1))
      const reached = new Set([puzzle.start])
      let edgeEnds = 0
      for (const cell of reached) {
        const exits = neighbors(puzzle, cell)
        edgeEnds += exits.length
        for (const next of exits) reached.add(next)
      }
      assert.equal(reached.size, 2 * size ** 2 - 1)
      assert.equal(reached.size, puzzle.open.reduce((sum, flag) => sum + flag, 0))
      assert.equal(edgeEnds / 2, reached.size - 1)
      assert.deepEqual(solveMaze(puzzle, puzzle.start, puzzle.goal), puzzle.solution)
      assert.deepEqual(measureMaze(puzzle, puzzle.solution), puzzle.metrics)
      assert.ok(puzzle.metrics.deadEnds >= 2)
    }
  }
  assert.throws(() => generateMaze(easy, -1), RangeError)
  assert.throws(() => generateMaze(easy, 0, 2), RangeError)
  assert.equal(fingerprint(generateMaze(easy, 123)),
    'e34fb0f997aef457d6de68a3c42fc66d1f0857bbc286ac5442fba4de9847bd4f')
})

test('12 seeds per size: score bands, winding routes and distinct grids', (t) => {
  const started = performance.now()
  const fields = ['pathLength', 'turns', 'deadEnds', 'decisions', 'wrongDepth']
  const seeds = Array.from({ length: 12 }, (_, i) => Math.imul(i + 1, 2654435761) >>> 0)
  for (const size of [6, 16, 30]) {
    const samples = Object.keys(levels).map((level) =>
      seeds.map((seed) => generateMaze({ size, level }, seed)))
    const means = samples.map((puzzles) => Object.fromEntries(fields.map((field) =>
      [field, puzzles.reduce((sum, puzzle) => sum + puzzle.metrics[field], 0) / seeds.length])))
    for (let i = 0; i < seeds.length; i++) {
      const scores = samples.map((puzzles) => difficultyScore(puzzles[i].metrics, size))
      assert.ok(scores[0] <= scores[1] && scores[1] <= scores[2])
    }
    for (const puzzles of samples) {
      assert.ok(new Set(puzzles.map(fingerprint)).size >= 10)
      assert.ok(puzzles.filter(({ metrics }) => metrics.pathLength > 4 * (size - 1) && metrics.turns >= 4).length >= 10)
    }
    for (const metric of ['pathLength', 'turns']) {
      assert.ok(means[0][metric] < means[1][metric] && means[1][metric] < means[2][metric], metric)
    }
    t.diagnostic(`${2 * size + 1}×${2 * size + 1}: ${JSON.stringify(means)}`)
  }
  t.diagnostic(`108 generations took ${Math.round(performance.now() - started)} ms locally`)
})

function finish(puzzle, play) {
  for (const cell of solveMaze(puzzle, play.position, puzzle.goal).slice(1)) {
    play = moveMaze(puzzle, play, cell, 250)
  }
  return play
}

test('walls, diagonals and jumps are rejected; the hint returns one legal step even in a wrong branch', () => {
  const puzzle = generateMaze(easy, 123)
  const play = startMaze(puzzle, 100)
  const { start, width } = puzzle
  for (const cell of [start - 1, start + width + 1, puzzle.solution[2]]) {
    assert.equal(moveMaze(puzzle, play, cell, 100), play)
  }
  let position = play
  let wrongBranch = -1
  for (const cell of puzzle.solution) {
    const exit = neighbors(puzzle, cell).find((next) => !puzzle.solution.includes(next))
    if (exit !== undefined) {
      wrongBranch = exit
      break
    }
    position = moveMaze(puzzle, position, puzzle.solution[puzzle.solution.indexOf(cell) + 1], 100)
  }
  assert.ok(canMove(puzzle, position.position, wrongBranch))
  const away = moveMaze(puzzle, position, wrongBranch, 100)
  const hint = hintMaze(puzzle, away)
  assert.equal(hint.play.position, away.position)
  assert.equal(hint.play.steps, away.steps)
  assert.equal(hint.play.hints, 1)
  assert.equal(hint.next, position.position)
  const back = moveMaze(puzzle, hint.play, hint.next, 100)
  assert.equal(back.visited, away.visited)
})

test('completion records only once, carries assistance, and remains unscored after reveal and restart', () => {
  const puzzle = generateMaze(easy, 123)
  const start = startMaze(puzzle, 100)
  const unassisted = finish(puzzle, start)
  const score = recordMazeResult([], puzzle, unassisted)
  assert.equal(score[0].hints, 0)
  assert.equal(score[0].elapsedMs, 150)
  const hinted = hintMaze(puzzle, start).play
  const assisted = finish(puzzle, hinted)
  assert.equal(recordMazeResult([], puzzle, assisted)[0].hints, 1)
  assert.equal(recordMazeResult(score, puzzle, assisted), score)
  assert.equal(moveMaze(puzzle, assisted, puzzle.solution.at(-2), 260), assisted)
  const revealed = { ...hinted, revealed: true }
  const restarted = restartMaze(puzzle, revealed, 200)
  assert.equal(restarted.position, puzzle.start)
  assert.equal(restarted.revealed, true)
  assert.equal(restarted.hints, 1)
  assert.equal(recordMazeResult([], puzzle, finish(puzzle, restarted)).length, 0)
})

test('reload restores the definition, next settings, explored trail, assisted history and reveal flag', () => {
  const map = new Map([[storageKey, '{"version":1}']])
  const storage = { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }
  const local = openMazeData(() => storage)
  const puzzle = generateMaze(easy, 123)
  const hinted = hintMaze(puzzle, startMaze(puzzle, 100)).play
  const play = moveMaze(puzzle, hinted, puzzle.solution[1], 150)
  const finished = finish(puzzle, play)
  local.data.next = { size: 30, level: 'hard' }
  local.data.active = { config: puzzle.config, revision: puzzle.revision, seed: puzzle.seed, play: finished }
  local.data.results = recordMazeResult([], puzzle, finished)
  assert.equal(local.save(), true)
  assert.deepEqual(openMazeData(() => storage).data, local.data)
  local.data.active.play = { ...play, revealed: true }
  assert.equal(local.save(), true)
  const restored = openMazeData(() => storage)
  assert.deepEqual(restored.data, local.data)
  assert.deepEqual(restored.puzzle, puzzle)
  assert.equal(map.get(storageKey), '{"version":1}')

  const malformed = JSON.parse(map.get(mazeStorageKey))
  malformed.active.play.visited = [puzzle.start, puzzle.goal, play.position]
  map.set(mazeStorageKey, JSON.stringify(malformed))
  const recovered = openMazeData(() => storage).data
  assert.equal(recovered.active, null)
  assert.deepEqual(recovered.results, local.data.results)

  map.set(mazeStorageKey, '{')
  assert.equal(openMazeData(() => storage).data.active, null)
  map.set(mazeStorageKey, '{"version":2}')
  assert.equal(openMazeData(() => storage).save(), false)
  assert.equal(map.get(mazeStorageKey), '{"version":2}')
  assert.equal(openMazeData(() => { throw new Error('blocked') }).save(), false)
})
