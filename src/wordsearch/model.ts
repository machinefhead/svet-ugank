import type { Config } from './config.ts'

export const revision = 4
export const hintLimit = 2

export interface Placement {
  readonly word: string
  readonly cells: readonly number[]
  readonly direction: number
}

export interface Puzzle {
  readonly id: string
  readonly seed: number
  readonly config: Config
  readonly letters: readonly string[]
  readonly placements: readonly Placement[]
}

export function puzzleId(config: Config, seed: number) {
  const { mode, difficulty, size, directions, wordCount } = config
  return `osmosmerka-r${revision}-${mode}-${difficulty}-${size}-${directions}-${wordCount}-${seed}`
}
