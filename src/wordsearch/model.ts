// Revision 1 settings and direction order are part of the saved R2 puzzle format.
export const legacyPresets = {
  easy: { label: 'Lahka', size: 8, count: 8, min: 3, max: 5, overlap: -1 },
  medium: { label: 'Srednja', size: 10, count: 10, min: 4, max: 7, overlap: 0 },
  hard: { label: 'Težka', size: 12, count: 13, min: 5, max: 12, overlap: 1 },
} as const

export type LegacyLevel = keyof typeof legacyPresets
export type Direction = readonly [row: number, col: number]
export const directions: readonly Direction[] = [
  [0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1],
]
export const revision = 2
export type Revision = 1 | typeof revision

export interface GeneratorConfig {
  readonly size: number
  readonly wordCount: number
  readonly minLength: number
  readonly maxLength: number
  readonly allowedDirections: readonly Direction[]
  readonly overlap: { readonly min: number; readonly target: number; readonly max: number }
  readonly filler: 'uniform' | 'dictionary'
  readonly minDiagonals: number
  readonly minReverse: number
  readonly minDirections: number
}

export const presets = {
  beginner: {
    label: 'Začetna', directionLabel: 'Desno in dol',
    size: 6, wordCount: 4, minLength: 3, maxLength: 4, allowedDirections: directions.slice(0, 2),
    overlap: { min: 0, target: 0, max: 1 }, filler: 'uniform',
    minDiagonals: 0, minReverse: 0, minDirections: 2,
  },
  easy: {
    label: 'Lahka', directionLabel: 'Desno, dol in obe diagonali navzdol',
    size: 8, wordCount: 6, minLength: 3, maxLength: 5, allowedDirections: directions.slice(0, 4),
    overlap: { min: 0, target: 1, max: 2 }, filler: 'uniform',
    minDiagonals: 1, minReverse: 0, minDirections: 3,
  },
  medium: {
    label: 'Srednja', directionLabel: 'Vseh osem smeri',
    size: 10, wordCount: 8, minLength: 4, maxLength: 7, allowedDirections: directions,
    overlap: { min: 2, target: 3, max: 5 }, filler: 'dictionary',
    minDiagonals: 2, minReverse: 2, minDirections: 4,
  },
} as const satisfies Record<string, GeneratorConfig & { label: string; directionLabel: string }>

export type Level = keyof typeof presets
export type PuzzleLevel = Level | LegacyLevel

// Optional custom configuration for new R2-format puzzles. Missing options
// must retain the exact historical generation algorithm and ID.
export const customSizes = [6, 8, 10, 12] as const
export const customDirections = [2, 4, 8] as const
export const customQuantities = ['few', 'normal', 'many'] as const
export interface WordsearchOptions {
  readonly size: typeof customSizes[number]
  readonly directions: typeof customDirections[number]
  readonly quantity: typeof customQuantities[number]
}
export const defaultWordsearchOptions: WordsearchOptions = { size: 6, directions: 2, quantity: 'normal' }

export function isWordsearchOptions(value: unknown): value is WordsearchOptions {
  if (!value || typeof value !== 'object') return false
  const entry = value as Record<string, unknown>
  return customSizes.some((size) => size === entry.size) &&
    customDirections.some((directions) => directions === entry.directions) &&
    customQuantities.some((quantity) => quantity === entry.quantity)
}
export const hintLimit = 2

export interface Placement {
  readonly word: string
  readonly cells: readonly number[]
}

export interface Puzzle {
  readonly id: string
  readonly revision: Revision
  readonly level: PuzzleLevel
  readonly size: number
  readonly letters: readonly string[]
  readonly placements: readonly Placement[]
  readonly options?: WordsearchOptions
}

export interface PlayState {
  readonly revision: Revision
  readonly level: PuzzleLevel
  readonly seed: number
  readonly startedAt: number
  readonly found: readonly string[]
  readonly hints: readonly string[]
  readonly revealed: boolean
  readonly options?: WordsearchOptions
}

export function isLevel(value: unknown): value is Level {
  return typeof value === 'string' && Object.hasOwn(presets, value)
}

export function isLevelForRevision(value: unknown, rev: 1): value is LegacyLevel
export function isLevelForRevision(value: unknown, rev: 2): value is Level
export function isLevelForRevision(value: unknown, rev: unknown): value is PuzzleLevel
export function isLevelForRevision(value: unknown, rev: unknown): value is PuzzleLevel {
  if (rev === 1) return typeof value === 'string' && Object.hasOwn(legacyPresets, value)
  return rev === revision && isLevel(value)
}

export function describePreset(level: PuzzleLevel, rev: Revision) {
  if (rev === 1 && isLevelForRevision(level, 1)) {
    return { ...legacyPresets[level], directionLabel: 'Vseh osem smeri' }
  }
  if (rev === revision && isLevel(level)) return presets[level]
  throw new RangeError('Neveljavne nastavitve osmosmerke.')
}

export function isSeed(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff
}

export function puzzleId(level: PuzzleLevel, seed: number, rev: Revision = revision,
  options?: WordsearchOptions) {
  if (options && rev === revision) {
    return `osmosmerka-r${rev}-${level}-s${options.size}-d${options.directions}-q${options.quantity}-${seed}`
  }
  return `osmosmerka-r${rev}-${level}-${seed}`
}
