export const sizes = [6, 8, 10, 12] as const
export const directionCounts = [2, 4, 8] as const
export const difficulties = {
  starter: 'Začetna', easy: 'Lahka', medium: 'Srednja', hard: 'Težka',
} as const

export type Difficulty = keyof typeof difficulties
type Size = typeof sizes[number]
type Directions = typeof directionCounts[number]

export interface Config {
  mode: 'classic' | 'custom'
  difficulty: Difficulty
  size: Size
  directions: Directions
  wordCount: number
}

export const presets = {
  starter: { size: 6, directions: 2, wordCount: 4 },
  easy: { size: 8, directions: 4, wordCount: 6 },
  medium: { size: 10, directions: 8, wordCount: 8 },
  hard: { size: 12, directions: 8, wordCount: 12 },
} as const

export const complexity = {
  starter: { min: 3, max: 4, overlap: -2, similarity: -1, weightedFill: false },
  easy: { min: 3, max: 5, overlap: 0.8, similarity: 0, weightedFill: false },
  medium: { min: 4, max: 7, overlap: 2, similarity: 0.5, weightedFill: true },
  hard: { min: 5, max: 10, overlap: 3, similarity: 2, weightedFill: true },
} as const

export const steps: readonly (readonly [number, number])[] = [
  [0, 1], [1, 0], [1, 1], [1, -1], [0, -1], [-1, 0], [-1, -1], [-1, 1],
]

export const directionLabels = {
  2: 'Desno in dol',
  4: 'Desno, dol in diagonali navzdol',
  8: 'Vseh osem smeri',
} as const

export function classic(difficulty: Difficulty): Config {
  return { mode: 'classic', difficulty, ...presets[difficulty] }
}

export const isDifficulty = (value: unknown): value is Difficulty =>
  typeof value === 'string' && Object.hasOwn(difficulties, value)

export function isConfig(value: unknown): value is Config {
  if (typeof value !== 'object' || value === null) return false
  const { mode, difficulty, size, directions, wordCount } = value as Config
  if (!isDifficulty(difficulty) || !sizes.includes(size) || !directionCounts.includes(directions) ||
      !Number.isInteger(wordCount) || wordCount < 3 || wordCount > 14) return false
  if (mode === 'custom') return true
  const preset = presets[difficulty]
  return mode === 'classic' && size === preset.size && directions === preset.directions && wordCount === preset.wordCount
}

export function configIssue(config: Config) {
  const { size, difficulty, wordCount } = config
  const { min, max } = complexity[difficulty]
  const room = Math.min(14, Math.floor(size * size * 0.85 / ((min + Math.min(max, size)) / 2)))
  return wordCount > room
    ? `Za to velikost in zahtevnost izberi od 3 do ${room} besed. Izbiro lahko ohraniš, če povečaš mrežo ali znižaš zahtevnost.`
    : ''
}

export function describe(config: Config) {
  const rule = complexity[config.difficulty]
  return `${config.size} × ${config.size} · ${config.wordCount} besed · ${directionLabels[config.directions]} · ${rule.min}–${Math.min(rule.max, config.size)} črk na besedo`
}
