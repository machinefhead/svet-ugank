export const presets = {
  easy: { label: 'Lahka', size: 8, count: 8, min: 3, max: 5, overlap: -1 },
  medium: { label: 'Srednja', size: 10, count: 10, min: 4, max: 7, overlap: 0 },
  hard: { label: 'Težka', size: 12, count: 13, min: 5, max: 12, overlap: 1 },
} as const

export type Level = keyof typeof presets
export type Direction = readonly [row: number, col: number]
export const directions: readonly Direction[] = [
  [0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1],
]
export const revision = 1
export const hintLimit = 2

export interface Placement {
  readonly word: string
  readonly cells: readonly number[]
}

export interface Puzzle {
  readonly id: string
  readonly level: Level
  readonly size: number
  readonly letters: readonly string[]
  readonly placements: readonly Placement[]
}

export interface PlayState {
  readonly level: Level
  readonly seed: number
  readonly startedAt: number
  readonly found: readonly string[]
  readonly hints: readonly string[]
  readonly revealed: boolean
}

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && Object.hasOwn(presets, value)
}

export function isSeed(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff
}

export function puzzleId(level: Level, seed: number) {
  return `osmosmerka-r${revision}-${level}-${seed}`
}
