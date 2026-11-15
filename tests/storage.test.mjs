import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
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
  data.nextLevel = 'medium'
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
    version: 2, theme: 'red', nickname: 8, nextLevel: 'impossible',
    play: { ...finished, found: ['NEZNANA'] },
    results: [...results, ...results, { ...results[0], puzzleId: 'fake' }],
  }))
  const restored = openLocalData(() => storage)
  assert.deepEqual(restored.data, {
    version: 2, theme: 'system', nickname: '', nextLevel: 'beginner', play: null, results,
  })
})

test('real R2 records preserve the active board, found words, hint and revision-specific results', () => {
  // This grid hash and word order were generated at the R2 baseline (2f85fb6).
  const storage = memoryStorage()
  const entry = {
    version: 1, theme: 'dark', nickname: 'Živa', nextLevel: 'hard',
    play: { revision: 1, level: 'hard', seed: 42, startedAt: 50, found: ['KAMEN'], hints: ['JABOLKO'], revealed: false },
    results: [{ puzzleId: 'osmosmerka-r1-easy-42', level: 'easy', finishedAt: 40, elapsedMs: 20, hints: 0 }],
  }
  const old = JSON.stringify(entry)
  storage.setItem(storageKey, old)
  const local = openLocalData(() => storage)
  assert.equal(storage.getItem(storageKey), old)
  const { puzzle, data } = local
  assert.equal(puzzle.id, 'osmosmerka-r1-hard-42')
  assert.equal(createHash('sha256').update(puzzle.letters.join('')).digest('hex'),
    '9026c28758854dbbf3e57d1ff4f713fdaef8d4ad576a784b4363a9addaf04036')
  assert.deepEqual(data.play, entry.play)
  assert.equal(data.nextLevel, 'medium')
  assert.equal(data.theme, 'dark')
  assert.equal(data.nickname, 'Živa')
  const cells = puzzle.placements[0].cells
  assert.equal(selectWord(puzzle, data.play, cells[0], cells.at(-1)).word, 'JABOLKO')
  const finished = { ...data.play, found: puzzle.placements.map(({ word }) => word) }
  data.results = recordResult(data.results, puzzle, finished, 650)
  assert.equal(recordResult(data.results, puzzle, finished, 777), data.results)
  const current = generatePuzzle('easy', 42)
  const newPlay = { ...startPuzzle('easy', 42, 700), found: current.placements.map(({ word }) => word) }
  data.results = recordResult(data.results, current, newPlay, 900)
  assert.deepEqual(data.results.map(({ puzzleId, revision }) => [puzzleId, revision]), [
    ['osmosmerka-r1-easy-42', 1], ['osmosmerka-r1-hard-42', 1], ['osmosmerka-r2-easy-42', 2],
  ])
  data.play = { ...data.play, revealed: true }
  assert.equal(local.save(), true)
  const restored = openLocalData(() => storage)
  assert.deepEqual(restored.data, data)
  assert.deepEqual(restored.puzzle, puzzle)
  assert.equal(useHint(restored.puzzle, restored.data.play), restored.data.play)
})

test('blocked storage, corrupt JSON and future schemas do not prevent local play', () => {
  const blocked = openLocalData(() => { throw new Error('storage blocked') })
  blocked.data.play = startPuzzle('beginner', 3, 12)
  assert.equal(blocked.available, false)
  assert.equal(blocked.save(), false)
  assert.equal(blocked.data.play.seed, 3)

  const storage = memoryStorage()
  storage.setItem(storageKey, '{')
  const corrupt = openLocalData(() => storage)
  assert.equal(corrupt.data.play, null)
  assert.equal(corrupt.save(), true)
  const future = '{"version":3,"anything":true}'
  storage.setItem(storageKey, future)
  const newer = openLocalData(() => storage)
  assert.equal(newer.save(), false)
  assert.equal(storage.getItem(storageKey), future)
})
