import { directions, isConfig, isSeed, mazeId, revision, type MazeConfig, type MazeMetrics, type MazePuzzle } from './model.ts'
import { adjacent, measureMaze, solveMaze } from './solver.ts'

const newestWeights = [0, 0.35, 0.6, 0.8, 0.95] as const
const rounds = 3
const rank = { easy: 0, medium: 0.5, hard: 1 } as const
const offsets = Object.values(directions)

function randomFrom(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = Math.imul(state ^ (state >>> 15), state | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000
  }
}

function carve(width: number, start: number, newestWeight: number, random: () => number) {
  const open = new Uint8Array(width * width)
  const active = [start]
  open[start] = 1
  while (active.length) {
    const index = random() < newestWeight ? active.length - 1 : Math.floor(random() * active.length)
    const cell = active[index]
    const nextCells = []
    for (const { dx, dy } of offsets) {
      const next = adjacent(width, cell, 2 * dx, 2 * dy)
      if (next !== -1 && !open[next]) nextCells.push(next)
    }
    if (nextCells.length === 0) {
      active.splice(index, 1)
      continue
    }
    const next = nextCells[Math.floor(random() * nextCells.length)]
    open[next] = 1
    open[(cell + next) / 2] = 1
    active.push(next)
  }
  return open
}

export function difficultyScore(metrics: MazeMetrics, size: number) {
  return (metrics.pathLength + 2 * metrics.turns + 6 * metrics.decisions + metrics.wrongDepth) / size
}

export function generateMaze(config: MazeConfig, seed: number, algorithm = revision): MazePuzzle {
  if (!isConfig(config) || !isSeed(seed) || algorithm !== revision) throw new RangeError('Neveljavni podatki labirinta.')
  const width = 2 * config.size + 1
  const start = width + 1
  const goal = (width - 2) * (width + 1)
  const random = randomFrom(seed)
  const candidates = []
  for (let round = 0; round < rounds; round++) {
    for (const weight of newestWeights) {
      const open = carve(width, start, weight, random)
      const solution = solveMaze({ width, open }, start, goal)
      if (solution.length === 0) throw new Error('Labirint nima poti do cilja.')
      const metrics = measureMaze({ width, open }, solution)
      candidates.push({ open, solution, metrics })
    }
  }

  // Prefer winding paths. If there are fewer winding candidates than levels,
  // rank the full set of verified candidates instead of generating more.
  const winding = candidates.filter(({ metrics }) =>
    metrics.pathLength >= 4.6 * (config.size - 1) && metrics.turns >= Math.max(4, Math.floor(config.size / 2)))
  const pool = winding.length >= 3 ? winding : candidates
  pool.sort((a, b) => difficultyScore(a.metrics, config.size) - difficultyScore(b.metrics, config.size))
  const selected = pool[Math.round(rank[config.level] * (pool.length - 1))]
  return { puzzleId: mazeId(config, seed), revision, seed, config: { ...config }, width, start, goal, ...selected }
}
