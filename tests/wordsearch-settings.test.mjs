import assert from 'node:assert/strict'
import { test } from 'node:test'
import { classic, configIssue, isConfig } from '../src/wordsearch/config.ts'
import { generatePuzzle } from '../src/wordsearch/generator.ts'
import { puzzleId } from '../src/wordsearch/model.ts'
import { decodeSession, encodeSession, nextHint, selectWord } from '../src/wordsearch/session.ts'
import { openSlot } from '../src/storage.ts'

const custom = { mode: 'custom', difficulty: 'medium', size: 10, directions: 4, wordCount: 7 }

test('classic packages are fixed and four custom choices remain independent', () => {
  assert.equal(isConfig({ ...classic('starter'), directions: 8 }), false)
  const variants = [
    { size: 12 }, { directions: 2 }, { wordCount: 9 }, { difficulty: 'hard' },
  ]
  for (const [change] of variants.map(Object.entries)) {
    const [key, value] = change
    const puzzle = generatePuzzle({ ...custom, [key]: value }, 10)
    assert.deepEqual(puzzle.config, { ...custom, [key]: value })
    assert.equal(puzzle.placements.length, puzzle.config.wordCount)
    assert.notEqual(puzzle.id, puzzleId(custom, 10))
  }
  const hardClassic = classic('hard')
  assert.notEqual(puzzleId(hardClassic, 5), puzzleId({ ...hardClassic, mode: 'custom' }, 5))
  const impossible = { ...custom, size: 6, wordCount: 12 }
  assert.ok(configIssue(impossible))
  assert.throws(() => generatePuzzle(impossible, 0), { name: 'RangeError' })
  assert.throws(() => generatePuzzle(custom, -1), { name: 'RangeError' })
})

test('reload restores the exact board, found words and hints without personal data', () => {
  const data = new Map()
  const getStorage = () => ({
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  })
  const puzzle = generatePuzzle(custom, 42)
  const initial = { puzzle, play: { found: [], hinted: [] } }
  const { cells } = puzzle.placements[0]
  const selected = { puzzle, play: selectWord(initial, cells[0], cells.at(-1)).play }
  const session = { puzzle, play: nextHint(selected).play }
  assert.equal(openSlot(getStorage, 'wordsearch', decodeSession, encodeSession).save(session), true)
  assert.deepEqual(openSlot(getStorage, 'wordsearch', decodeSession, encodeSession).value, session)
  const entry = JSON.parse(data.get('svet-ugank:r4:wordsearch'))
  assert.deepEqual(Object.keys(entry.value).sort(), ['config', 'found', 'hinted', 'id', 'revision', 'seed'])
  data.set('svet-ugank:r4:wordsearch', JSON.stringify({ ...entry, value: { ...entry.value, found: ['OBOJE'] } }))
  assert.equal(openSlot(getStorage, 'wordsearch', decodeSession, encodeSession).invalid, true)
  assert.equal(decodeSession({ ...entry.value, id: 'old-id' }), null)
})
