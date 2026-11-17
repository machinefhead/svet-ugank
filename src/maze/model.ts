export const sizes = [13, 21, 33, 45, 61] as const
export const levels = { easy: 'Lahka', medium: 'Srednja', hard: 'Zahtevna' } as const
export const revision = 4

export interface MazeConfig {
  readonly size: typeof sizes[number]
  readonly level: keyof typeof levels
}

export const defaultConfig: MazeConfig = { size: 13, level: 'easy' }

export const directions = {
  up: [-1, 0], right: [0, 1], down: [1, 0], left: [0, -1],
} as const
export type Direction = keyof typeof directions

export interface MazeMetrics {
  readonly steps: number
  readonly turns: number
  readonly junctions: number
  readonly deadEnds: number
  readonly branchDepth: number
}

export interface MazeGrid {
  readonly width: number
  readonly open: Uint8Array
  readonly start: number
  readonly goal: number
}

export interface MazePuzzle extends MazeGrid {
  readonly id: string
  readonly seed: number
  readonly config: MazeConfig
  readonly solution: readonly number[]
  readonly metrics: MazeMetrics
}

export function isConfig(value: unknown): value is MazeConfig {
  if (typeof value !== 'object' || value === null) return false
  const { size, level } = value as MazeConfig
  return sizes.includes(size) && typeof level === 'string' && Object.hasOwn(levels, level)
}

export const mazeId = (config: MazeConfig, seed: number) => `labirint-r${revision}-${config.size}-${config.level}-${seed}`
