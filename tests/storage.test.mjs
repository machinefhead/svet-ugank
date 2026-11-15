import assert from 'node:assert/strict'
import { test } from 'node:test'
import { openLocalData, storageKey, normalizeNickname } from '../src/storage.ts'
import { generatePuzzle } from '../src/wordsearch/generator.ts'
import { recordResult, selectWord, startPuzzle, useHint } from '../src/wordsearch/session.ts'

function memoryStorage() {
  const map = new Map()
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }
}

test('reload resumes the same board, found words, hint, nickname, theme and next settings', () => {
  const storage = memoryStorage()
  const { data, save } = openLocalData(() => storage)
  assert.equal(data.play, null)
  data.nickname = normalizeNickname('  Živa  ')
  data.theme = 'dark'
  data.nextLevel = 'hard'
  const puzzle = generatePuzzle('easy', 42)
  const play = useHint(puzzle, startPuzzle('easy', 42, 50))
  const cells = puzzle.placements[1].cells
  data.play = selectWord(puzzle, play, cells[0], cells.at(-1)).play
  assert.equal(save(), true)
  const restored = openLocalData(() => storage)
  assert.equal(restored.available, true)
  assert.deepEqual(restored.data, data)
  assert.deepEqual(restored.puzzle, puzzle)
})

test('valid local results survive reload; malformed progress, fields and duplicate results are discarded', () => {
  const storage = memoryStorage()
  const puzzle = generatePuzzle('easy', 42)
  const finished = { ...startPuzzle('easy', 42, 50), found: puzzle.placements.map(({ word }) => word) }
  const results = recordResult([], puzzle, finished, 100)
  storage.setItem(storageKey, JSON.stringify({
    version: 1, theme: 'red', nickname: 8, nextLevel: 'impossible',
    play: { ...finished, revision: 1, found: ['NEZNANA'] },
    results: [...results, ...results, { ...results[0], puzzleId: 'fake' }],
  }))
  const restored = openLocalData(() => storage)
  assert.deepEqual(restored.data, {
    version: 1, theme: 'system', nickname: '', nextLevel: 'easy', play: null, results,
  })
})

test('blocked storage, corrupt JSON and future schemas do not prevent local play', () => {
  const blocked = openLocalData(() => { throw new Error('storage blocked') })
  blocked.data.play = startPuzzle('hard', 3, 12)
  assert.equal(blocked.available, false)
  assert.equal(blocked.save(), false)
  assert.equal(blocked.data.play.seed, 3)

  const storage = memoryStorage()
  storage.setItem(storageKey, '{')
  const corrupt = openLocalData(() => storage)
  assert.equal(corrupt.data.play, null)
  assert.equal(corrupt.save(), true)
  const future = '{"version":2,"anything":true}'
  storage.setItem(storageKey, future)
  const newer = openLocalData(() => storage)
  assert.equal(newer.save(), false)
  assert.equal(storage.getItem(storageKey), future)
})
