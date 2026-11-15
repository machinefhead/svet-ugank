import { generateMaze } from './generator.ts'
import { defaultConfig, isConfig, isSeed, mazeId, revision, type MazeConfig, type MazePuzzle } from './model.ts'
import { neighbors, solveMaze } from './solver.ts'
import type { MazePlay, MazeResult } from './session.ts'

export const mazeStorageKey = 'svet-ugank:maze'
const version = 1

interface SavedMaze {
  config: MazeConfig
  seed: number
  revision: number
  play: MazePlay
}

interface MazeData {
  version: typeof version
  next: MazeConfig
  active: SavedMaze | null
  results: readonly MazeResult[]
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

function count(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function timestamp(value: unknown): value is number {
  return count(value) && value <= 8.64e15
}

function readPlay(puzzle: MazePuzzle, value: unknown): MazePlay | null {
  const entry = object(value)
  if (!entry || !count(entry.position) || !count(entry.steps) || !count(entry.hints) ||
    !timestamp(entry.startedAt) || typeof entry.revealed !== 'boolean' ||
    (entry.finishedAt !== null && (!timestamp(entry.finishedAt) || entry.finishedAt < entry.startedAt)) ||
    (entry.finishedAt !== null) !== (entry.position === puzzle.goal) ||
    !Array.isArray(entry.visited) || entry.visited[0] !== puzzle.start ||
    entry.visited.length > 2 * puzzle.config.size ** 2 - 1) return null

  // Each first visit must extend the connected explored region by one legal move.
  const visited = new Set<number>([puzzle.start])
  for (const cell of entry.visited.slice(1)) {
    if (!count(cell) || !puzzle.open[cell] || visited.has(cell) ||
      !neighbors(puzzle, cell).some((next) => visited.has(next))) return null
    visited.add(cell)
  }
  if (!visited.has(entry.position) || visited.has(puzzle.goal) !== (entry.finishedAt !== null)) return null
  const distance = solveMaze(puzzle, puzzle.start, entry.position).length - 1
  const minSteps = 2 * (visited.size - 1) - distance
  if (entry.steps < minSteps || (entry.steps - minSteps) % 2 !== 0) return null
  return { position: entry.position, steps: entry.steps, hints: entry.hints, visited: [...visited],
    startedAt: entry.startedAt, finishedAt: entry.finishedAt, revealed: entry.revealed }
}

function readResults(value: unknown) {
  const results: MazeResult[] = []
  if (!Array.isArray(value)) return results
  const ids = new Set<string>()
  for (const item of value) {
    const entry = object(item)
    if (!entry || typeof entry.puzzleId !== 'string' || ids.has(entry.puzzleId) || !isConfig(entry.config) ||
      !timestamp(entry.finishedAt) || !timestamp(entry.elapsedMs) || entry.elapsedMs > entry.finishedAt ||
      !count(entry.steps) || entry.steps < 4 * (entry.config.size - 1) || entry.steps % 2 !== 0 ||
      !count(entry.hints)) continue
    const seed = Number(entry.puzzleId.split('-').at(-1))
    if (!isSeed(seed) || mazeId(entry.config, seed) !== entry.puzzleId) continue
    ids.add(entry.puzzleId)
    results.push({ puzzleId: entry.puzzleId, config: entry.config, finishedAt: entry.finishedAt,
      elapsedMs: entry.elapsedMs, steps: entry.steps, hints: entry.hints })
  }
  return results
}

export function openMazeData(getStorage: () => Pick<Storage, 'getItem' | 'setItem'>) {
  const data: MazeData = { version, next: { ...defaultConfig }, active: null, results: [] }
  let puzzle: MazePuzzle | null = null
  let supported = true
  let available = false
  try {
    const storage = getStorage()
    const raw = storage.getItem(mazeStorageKey)
    if (raw !== null) {
      try {
        const entry = object(JSON.parse(raw))
        if (entry?.version === version) {
          if (isConfig(entry.next)) data.next = entry.next
          data.results = readResults(entry.results)
          const active = object(entry.active)
          if (active?.revision === revision && isConfig(active.config) && isSeed(active.seed)) {
            const definition = generateMaze(active.config, active.seed, active.revision)
            const play = readPlay(definition, active.play)
            if (play) {
              data.active = { config: definition.config, seed: definition.seed, revision, play }
              puzzle = definition
            }
          }
        } else if (entry && typeof entry.version === 'number' && entry.version > version) {
          supported = false
        }
      } catch {
        // Discard malformed data; a new game can still be played.
      }
    }
    if (supported) {
      // Probe without changing existing data or touching the word search key.
      storage.setItem(mazeStorageKey, raw ?? JSON.stringify(data))
      available = true
    }
  } catch {
    // The same state remains usable in memory.
  }
  const save = () => {
    if (!supported) return false
    try {
      getStorage().setItem(mazeStorageKey, JSON.stringify(data))
      available = true
    } catch {
      available = false
    }
    return available
  }
  return { data, puzzle, save, get available() { return available } }
}
