import { generatePuzzle } from './wordsearch/generator.ts'
import { hintLimit, isLevel, isSeed, puzzleId, revision, type Level, type PlayState, type Puzzle } from './wordsearch/model.ts'
import type { Result } from './wordsearch/session.ts'

export const storageKey = 'svet-ugank:r2'
export const nicknameLimit = 24
export type Theme = 'system' | 'light' | 'dark'

export interface LocalData {
  version: 1
  theme: Theme
  nickname: string
  nextLevel: Level
  play: PlayState | null
  results: readonly Result[]
}

type LocalStorage = Pick<Storage, 'getItem' | 'setItem'>

const defaults = (): LocalData => ({
  version: 1, theme: 'system', nickname: '', nextLevel: 'easy', play: null, results: [],
})

export function isTheme(value: unknown): value is Theme {
  return value === 'system' || value === 'light' || value === 'dark'
}

export function normalizeNickname(value: string) {
  return value.replace(/[\p{Cc}\p{Cf}]/gu, '').trim().slice(0, nicknameLimit).trimEnd()
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

function timestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 8.64e15
}

function uniqueWords(value: unknown, allowed: Set<string>, max = allowed.size): string[] | null {
  if (!Array.isArray(value) || value.length > max ||
    !value.every((word): word is string => typeof word === 'string' && allowed.has(word)) ||
    new Set(value).size !== value.length) return null
  return value
}

function readPlay(value: unknown): { play: PlayState | null; puzzle: Puzzle | null } {
  const empty = { play: null, puzzle: null }
  const entry = object(value)
  if (!entry || entry.revision !== revision || !isLevel(entry.level) || !isSeed(entry.seed) ||
    !timestamp(entry.startedAt) || typeof entry.revealed !== 'boolean') return empty
  try {
    const puzzle = generatePuzzle(entry.level, entry.seed)
    const allowed = new Set(puzzle.placements.map(({ word }) => word))
    const found = uniqueWords(entry.found, allowed)
    const hints = uniqueWords(entry.hints, allowed, hintLimit)
    if (!found || !hints) return empty
    return { puzzle, play: { level: entry.level, seed: entry.seed, startedAt: entry.startedAt,
      found, hints, revealed: entry.revealed } }
  } catch {
    return empty
  }
}

function readResults(value: unknown): Result[] {
  if (!Array.isArray(value)) return []
  const ids = new Set<string>()
  const results: Result[] = []
  for (const valueEntry of value) {
    const entry = object(valueEntry)
    if (!entry || typeof entry.puzzleId !== 'string' || !isLevel(entry.level) ||
      !timestamp(entry.finishedAt) || !timestamp(entry.elapsedMs) || entry.elapsedMs > entry.finishedAt ||
      typeof entry.hints !== 'number' || !Number.isInteger(entry.hints) || entry.hints < 0 ||
      entry.hints > hintLimit || ids.has(entry.puzzleId)) continue
    const seed = Number(entry.puzzleId.split('-').at(-1))
    if (!isSeed(seed) || entry.puzzleId !== puzzleId(entry.level, seed)) continue
    ids.add(entry.puzzleId)
    results.push({ puzzleId: entry.puzzleId, level: entry.level, finishedAt: entry.finishedAt,
      elapsedMs: entry.elapsedMs, hints: entry.hints })
  }
  return results
}

export function openLocalData(getStorage: () => LocalStorage) {
  let data = defaults()
  let puzzle: Puzzle | null = null
  let available = false
  let supported = true
  try {
    const storage = getStorage()
    const raw = storage.getItem(storageKey)
    if (raw !== null) {
      try {
        const entry = object(JSON.parse(raw))
        if (entry?.version === 1) {
          const active = readPlay(entry.play)
          puzzle = active.puzzle
          data = {
            version: 1,
            theme: isTheme(entry.theme) ? entry.theme : 'system',
            nickname: typeof entry.nickname === 'string' ? normalizeNickname(entry.nickname) : '',
            nextLevel: isLevel(entry.nextLevel) ? entry.nextLevel : 'easy',
            play: active.play,
            results: readResults(entry.results),
          }
        } else if (entry && typeof entry.version === 'number' && entry.version > 1) {
          supported = false
        }
      } catch {
        // Malformed JSON is recoverable with the next intentional save.
      }
    }
    if (supported) {
      // Check write access without replacing a saved game, even on a read-only visit.
      storage.setItem(storageKey, raw ?? JSON.stringify(data))
      available = true
    }
  } catch {
    // Play remains available with this tab's in-memory data.
  }

  const save = () => {
    if (!supported) return false
    try {
      getStorage().setItem(storageKey, JSON.stringify({
        ...data, play: data.play && { ...data.play, revision },
      }))
      available = true
    } catch {
      available = false
    }
    return available
  }

  return { data, puzzle, save, get available() { return available } }
}
