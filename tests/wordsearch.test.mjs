import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findWord, isComplete, lineBetween } from '../src/wordsearch/checker.ts'
import { generatePuzzle } from '../src/wordsearch/generator.ts'
import { directions, presets } from '../src/wordsearch/model.ts'
import { recordResult, selectWord, startPuzzle, useHint } from '../src/wordsearch/session.ts'

test('presets produce repeatable, distinct boards with eight directions, šumniki, and unique answers', () => {
  for (const [level, preset] of Object.entries(presets)) {
    const first = generatePuzzle(level, 123)
    assert.deepEqual(first, generatePuzzle(level, 123))
    assert.notDeepEqual(first.letters, generatePuzzle(level, 124).letters)
    for (const seed of [...Array.from({ length: 24 }, (_, i) => i), 0xffffffff]) {
      const puzzle = generatePuzzle(level, seed)
      assert.equal(puzzle.size, preset.size)
      assert.equal(puzzle.letters.length, preset.size ** 2)
      assert.equal(puzzle.placements.length, preset.count)
      assert.ok(puzzle.placements.some(({ word }) => /[ČŠŽ]/u.test(word)))
      const steps = new Set()
      for (const { word, cells } of puzzle.placements) {
        assert.ok(word.length >= preset.min && word.length <= preset.max)
        assert.equal(cells.map((cell) => puzzle.letters[cell]).join(''), word)
        const start = cells[0]
        const end = cells.at(-1)
        assert.equal(findWord(puzzle, start, end), word)
        assert.equal(findWord(puzzle, end, start), word)
        const row = (cell) => Math.floor(cell / puzzle.size)
        const col = (cell) => cell % puzzle.size
        steps.add([row(cells[1]) - row(start), col(cells[1]) - col(start)].join(','))
        let copies = 0
        for (let r = 0; r < puzzle.size; r++) {
          for (let c = 0; c < puzzle.size; c++) {
            for (const [dr, dc] of directions) {
              if ([...word].every((letter, i) => {
                const y = r + i * dr, x = c + i * dc
                return y >= 0 && y < puzzle.size && x >= 0 && x < puzzle.size &&
                  puzzle.letters[y * puzzle.size + x] === letter
              })) copies++
            }
          }
        }
        assert.equal(copies, 1, `${puzzle.id}: ${word}`)
      }
      assert.deepEqual(steps, new Set(directions.map(String)))
    }
  }
})

test('invalid settings and selections are rejected, including row wrap', () => {
  for (const [level, seed] of [['3×3 s 100 besedami', 0], ['toString', 0], ['easy', -1], ['hard', Infinity]]) {
    assert.throws(() => generatePuzzle(level, seed), RangeError)
  }
  const puzzle = generatePuzzle('easy', 12)
  for (const [from, to] of [[-1, 3], [7, 8], [0, 10], [0, 64], [0.5, 2]]) {
    assert.deepEqual(lineBetween(puzzle.size, from, to), [])
    assert.equal(findWord(puzzle, from, to), undefined)
  }
  assert.equal(findWord(puzzle, 1, 1), undefined)
})

test('every word must be found; repeated selections or completion cannot award twice', () => {
  const puzzle = generatePuzzle('medium', 314)
  let play = startPuzzle('medium', 314, 100)
  play = useHint(puzzle, play)
  play = useHint(puzzle, play)
  assert.equal(play.hints.length, 2)
  assert.equal(useHint(puzzle, play), play)
  assert.deepEqual(play.found, [])
  assert.equal(selectWord(puzzle, play, 0, 12).status, 'invalid')
  for (const [index, { cells }] of puzzle.placements.entries()) {
    assert.equal(isComplete(puzzle, play.found), false)
    assert.deepEqual(recordResult([], puzzle, play, 650), [])
    const move = selectWord(puzzle, play, cells.at(-1), cells[0])
    play = move.play
    const complete = index === puzzle.placements.length - 1
    assert.equal(move.status, complete ? 'complete' : 'found')
    const repeat = selectWord(puzzle, play, cells[0], cells.at(-1))
    assert.equal(repeat.status, complete ? 'closed' : 'already-found')
    assert.equal(repeat.play, play)
  }
  const results = recordResult([], puzzle, play, 650)
  assert.deepEqual(results, [{ puzzleId: puzzle.id, level: 'medium', elapsedMs: 550, hints: 2, finishedAt: 650 }])
  assert.equal(recordResult(results, puzzle, play, 777), results)
  assert.deepEqual(recordResult([], puzzle, { ...play, revealed: true }, 650), [])
  assert.equal(selectWord(puzzle, { ...play, revealed: true, found: [] }, 0, 9).status, 'closed')
})
