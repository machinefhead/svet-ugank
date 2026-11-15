export const sizes = [6, 10, 16, 22, 30] as const
export const levels = { easy: 'Lahka', medium: 'Srednja', hard: 'Zahtevna' } as const
export const revision = 1

export interface MazeConfig {
  size: typeof sizes[number]
  level: keyof typeof levels
}

export const defaultConfig: MazeConfig = { size: 6, level: 'easy' }

export interface MazeMetrics {
  pathLength: number
  turns: number
  deadEnds: number
  decisions: number
  wrongDepth: number
}

export interface MazePuzzle {
  puzzleId: string
  revision: typeof revision
  seed: number
  config: MazeConfig
  width: number
  open: Uint8Array
  start: number
  goal: number
  solution: readonly number[]
  metrics: MazeMetrics
}

export const directions = {
  up: { dx: 0, dy: -1, label: 'Gor', icon: '↑' },
  left: { dx: -1, dy: 0, label: 'Levo', icon: '←' },
  down: { dx: 0, dy: 1, label: 'Dol', icon: '↓' },
  right: { dx: 1, dy: 0, label: 'Desno', icon: '→' },
} as const
export type Direction = keyof typeof directions

export function isConfig(value: unknown): value is MazeConfig {
  if (!value || typeof value !== 'object' || !('size' in value) || !('level' in value)) return false
  return sizes.some((size) => size === value.size) &&
    typeof value.level === 'string' && Object.hasOwn(levels, value.level)
}

export function isSeed(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 0xffffffff
}

export function mazeId(config: MazeConfig, seed: number) {
  return `labirint-r${revision}-${config.size}-${config.level}-${seed}`
}
