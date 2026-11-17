import { isSeed, seededRandom } from '../random.ts'
import { isConfig, mazeId, type MazeConfig, type MazeGrid, type MazeMetrics } from './model.ts'
import { verifyMaze } from './solver.ts'

interface Edge {
  from: number
  to: number
  gap: number
}

function buildEdges(width: number) {
  const edges: Edge[] = []
  for (let row = 1; row < width - 1; row += 2) {
    for (let col = 1; col < width - 1; col += 2) {
      const from = row * width + col
      if (col + 2 < width - 1) edges.push({ from, to: from + 2, gap: from + 1 })
      if (row + 2 < width - 1) edges.push({ from, to: from + 2 * width, gap: from + width })
    }
  }
  return edges
}

function carve(width: number, edges: Edge[], random: () => number): MazeGrid {
  const open = new Uint8Array(width ** 2)
  const roots = Int32Array.from(open, (_, i) => i)
  const rank = new Uint8Array(open.length)
  function root(cell: number) {
    while (roots[cell] !== cell) {
      roots[cell] = roots[roots[cell]]
      cell = roots[cell]
    }
    return cell
  }
  for (let i = edges.length - 1; i >= 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const edge = edges[j]
    edges[j] = edges[i]
    edges[i] = edge
    const { from, to, gap } = edge
    open[from] = open[to] = 1
    const a = root(from)
    const b = root(to)
    if (a === b) continue
    if (rank[a] < rank[b]) roots[a] = b
    else {
      roots[b] = a
      if (rank[a] === rank[b]) rank[a]++
    }
    open[gap] = 1
  }
  return { width, open, start: width + 1, goal: (width - 2) * width + width - 2 }
}

export function difficultyScore(metrics: MazeMetrics, width: number) {
  return (metrics.steps + 2 * metrics.turns + 5 * metrics.junctions + 0.5 * metrics.deadEnds + metrics.branchDepth) / width
}

export function generateMaze(config: MazeConfig, seed: number) {
  if (!isConfig(config) || !isSeed(seed)) throw new RangeError('Neveljavne nastavitve labirinta.')
  const random = seededRandom(seed)
  const { size: width, level } = config
  const edges = buildEdges(width)
  const candidates = []
  for (let i = 0; i < 15; i++) {
    const grid = carve(width, [...edges], random)
    const proof = verifyMaze(grid)
    if (proof) candidates.push({ ...grid, ...proof })
  }
  const winding = candidates.filter(({ metrics }) =>
    metrics.steps >= 2.2 * (width - 3) && metrics.turns >= 4 && metrics.junctions >= 2)
  const pool = winding.length >= 3 ? winding : candidates
  pool.sort((a, b) => difficultyScore(a.metrics, width) - difficultyScore(b.metrics, width))
  const index = { easy: 0, medium: Math.floor(pool.length / 2), hard: pool.length - 1 }[level]
  const picked = pool[index]
  if (!picked) throw new RangeError('Labirinta ni bilo mogoče sestaviti. Poskusi znova.')
  return { ...picked, config: { ...config }, seed, id: mazeId(config, seed) }
}
