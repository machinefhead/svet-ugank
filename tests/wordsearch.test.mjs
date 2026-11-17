import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findWord, lineBetween, verifyPuzzle } from '../src/wordsearch/checker.ts'
import { classic, difficulties, steps } from '../src/wordsearch/config.ts'
import { generatePuzzle } from '../src/wordsearch/generator.ts'
import { puzzleId } from '../src/wordsearch/model.ts'
import { complete, nextHint, selectWord } from '../src/wordsearch/session.ts'
import { alphabet, words } from '../src/wordsearch/words.ts'

const samples = [
  ...Object.keys(difficulties).map(classic),
  { mode: 'custom', difficulty: 'starter', size: 6, directions: 8, wordCount: 8 },
  { mode: 'custom', difficulty: 'hard', size: 6, directions: 2, wordCount: 5 },
  { mode: 'custom', difficulty: 'medium', size: 8, directions: 4, wordCount: 9 },
  { mode: 'custom', difficulty: 'hard', size: 10, directions: 4, wordCount: 11 },
  { mode: 'custom', difficulty: 'hard', size: 12, directions: 2, wordCount: 14 },
]

test('100 seeds for each preset and five custom configurations are unique, valid and varied', () => {
  const observed = new Set()
  for (const config of samples) {
    const fingerprints = new Set()
    for (let seed = 0; seed < 100; seed++) {
      const puzzle = generatePuzzle(config, seed)
      assert.deepEqual(puzzle.config, config)
      assert.equal(puzzle.id, puzzleId(config, seed))
      assert.ok(verifyPuzzle(puzzle), puzzle.id)
      assert.ok(puzzle.letters.every((letter) => alphabet.includes(letter)))
      assert.ok(puzzle.placements.some(({ word }) => /[ČŠŽ]/u.test(word)))
      assert.equal(puzzle.placements.length, config.wordCount)
      for (const { cells, direction, word } of puzzle.placements) {
        assert.ok(words.includes(word))
        assert.ok(direction < config.directions)
        assert.equal(findWord(puzzle, cells[0], cells.at(-1)), word)
        assert.equal(findWord(puzzle, cells.at(-1), cells[0]), word)
        if (config.directions === 8) observed.add(direction)
      }
      if (config.mode === 'classic' && config.difficulty === 'hard') {
        assert.equal(new Set(puzzle.placements.map(({ direction }) => direction)).size, 8)
      }
      fingerprints.add(puzzle.letters.join(''))
    }
    assert.equal(fingerprints.size, 100)
    assert.deepEqual(generatePuzzle(config, 24), generatePuzzle(config, 24))
  }
  assert.equal(observed.size, steps.length)
})

test('straight lines respect boundaries and checker rejects copied answers', () => {
  assert.deepEqual(lineBetween(6, 5, 6), [])
  assert.deepEqual(lineBetween(6, -1, 5), [])
  assert.deepEqual(lineBetween(6, 2.5, 11), [])
  assert.deepEqual(lineBetween(6, 5, 20), [5, 10, 15, 20])
  const config = { ...classic('starter'), wordCount: 1 }
  const puzzle = {
    config,
    letters: Array.from('DEŽXXX' + 'X'.repeat(30)),
    placements: [{ word: 'DEŽ', cells: [0, 1, 2], direction: 0 }],
  }
  assert.equal(verifyPuzzle(puzzle), true)
  assert.equal(findWord(puzzle, 0, 1), undefined)
  puzzle.letters.splice(33, 3, ...'ŽED')
  assert.equal(verifyPuzzle(puzzle), false)
  assert.equal(findWord(puzzle, 33, 35), undefined)
})

test('selection distinguishes mistakes and repeated words; hints are bounded and do not alter found words', () => {
  const puzzle = generatePuzzle(classic('medium'), 5)
  let session = { puzzle, play: { found: [], hinted: [] } }
  assert.equal(selectWord(session, 0, 0).status, 'invalid')
  const hint = nextHint(session)
  assert.match(hint.orientation, /^(vodoravno|navpično|poševno)$/u)
  assert.deepEqual(hint.play.found, [])
  session = { puzzle, play: nextHint({ puzzle, play: hint.play }).play }
  assert.equal(nextHint(session), undefined)
  for (const { word, cells } of puzzle.placements) {
    assert.equal(complete(session), false)
    const result = selectWord(session, cells[0], cells.at(-1))
    assert.equal(result.status, 'found')
    assert.equal(result.word, word)
    session = { puzzle, play: result.play }
    assert.equal(selectWord(session, cells[0], cells.at(-1)).status, complete(session) ? 'closed' : 'already-found')
  }
  assert.equal(complete(session), true)
})
