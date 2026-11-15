import { directions, type MazeMetrics, type MazePuzzle } from './model.ts'

type Grid = Pick<MazePuzzle, 'width' | 'open'>

export function adjacent(width: number, from: number, dx: number, dy: number) {
  const x = from % width + dx
  const y = Math.floor(from / width) + dy
  return x >= 0 && x < width && y >= 0 && y < width ? y * width + x : -1
}

export function canMove(grid: Grid, from: number, to: number) {
  return Boolean(grid.open[from] && grid.open[to]) &&
    Math.abs(from % grid.width - to % grid.width) +
      Math.abs(Math.floor(from / grid.width) - Math.floor(to / grid.width)) === 1
}

export function neighbors(grid: Grid, from: number) {
  const result: number[] = []
  for (const { dx, dy } of Object.values(directions)) {
    const next = adjacent(grid.width, from, dx, dy)
    if (grid.open[next]) result.push(next)
  }
  return result
}

export function solveMaze(grid: Grid, start: number, goal: number): number[] {
  if (!grid.open[start] || !grid.open[goal]) return []
  const previous = new Int32Array(grid.open.length).fill(-1)
  const queue = [start]
  previous[start] = start
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const cell = queue[cursor]
    if (cell === goal) {
      const path = [goal]
      while (path.at(-1) !== start) path.push(previous[path.at(-1)!])
      return path.reverse()
    }
    for (const next of neighbors(grid, cell)) {
      if (previous[next] !== -1) continue
      previous[next] = cell
      queue.push(next)
    }
  }
  return []
}

export function measureMaze(grid: Grid, path: readonly number[]): MazeMetrics {
  let turns = 0
  for (let i = 2; i < path.length; i++) {
    if (path[i] - path[i - 1] !== path[i - 1] - path[i - 2]) turns++
  }

  const distance = new Int32Array(grid.open.length).fill(-1)
  const queue = [...path]
  for (const cell of path) distance[cell] = 0
  let deadEnds = 0
  let decisions = 0
  let wrongDepth = 0
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const cell = queue[cursor]
    const exits = neighbors(grid, cell)
    if (exits.length === 1) deadEnds++
    if (cursor < path.length - 1 && exits.length > (cursor === 0 ? 1 : 2)) decisions++
    for (const next of exits) {
      if (distance[next] !== -1) continue
      distance[next] = distance[cell] + 1
      wrongDepth = Math.max(wrongDepth, distance[next])
      queue.push(next)
    }
  }
  return { pathLength: path.length - 1, turns, deadEnds, decisions, wrongDepth }
}
