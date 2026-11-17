import { directions, type Direction, type MazeGrid, type MazeMetrics } from './model.ts'

const offsets = Object.values(directions)

function adjacent(width: number, from: number, dy: number, dx: number) {
  const row = Math.floor(from / width) + dy
  const col = from % width + dx
  return row >= 0 && col >= 0 && row < width && col < width ? row * width + col : -1
}

export function step(grid: MazeGrid, from: number, direction: Direction) {
  const [dy, dx] = directions[direction]
  return adjacent(grid.width, from, dy, dx)
}

export function canMove({ width, open }: MazeGrid, from: number, to: number) {
  return Number.isInteger(from) && Number.isInteger(to) && open[from] === 1 && open[to] === 1 &&
    Math.abs(Math.floor(from / width) - Math.floor(to / width)) + Math.abs(from % width - to % width) === 1
}

export function neighbors({ width, open }: MazeGrid, from: number) {
  const cells: number[] = []
  for (const [dy, dx] of offsets) {
    const cell = adjacent(width, from, dy, dx)
    if (open[cell] === 1) cells.push(cell)
  }
  return cells
}

function traverse(grid: MazeGrid, first: number) {
  const parents = new Int32Array(grid.open.length).fill(-1)
  const queue = [first]
  parents[first] = first
  let edgeEnds = 0
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i]
    const next = neighbors(grid, cell)
    edgeEnds += next.length
    for (const target of next) {
      if (parents[target] !== -1) continue
      parents[target] = cell
      queue.push(target)
    }
  }
  return { parents, visited: queue.length, edges: edgeEnds / 2 }
}

function pathFrom(parents: Int32Array, from: number, to: number) {
  if (parents[to] === undefined || parents[to] === -1) return []
  const path = [to]
  while (to !== from) {
    to = parents[to]
    path.push(to)
  }
  return path.reverse()
}

export function solveMaze(grid: MazeGrid, start: number, goal: number) {
  if (grid.open[start] !== 1 || grid.open[goal] !== 1) return []
  return pathFrom(traverse(grid, start).parents, start, goal)
}

function measure(grid: MazeGrid, path: number[]): MazeMetrics {
  let turns = 0
  let junctions = 0
  let deadEnds = 0
  let branchDepth = 0
  const distances = new Int32Array(grid.open.length).fill(-1)
  const queue = [...path]
  path.forEach((cell, i) => {
    distances[cell] = 0
    if (neighbors(grid, cell).length > 2) junctions++
    if (i >= 2 && cell - path[i - 1] !== path[i - 1] - path[i - 2]) turns++
  })
  for (let i = 0; i < queue.length; i++) {
    const cell = queue[i]
    const next = neighbors(grid, cell)
    const distance = distances[cell]
    if (distance > 0 && next.length === 1) deadEnds++
    for (const target of next) {
      if (distances[target] !== -1) continue
      distances[target] = distance + 1
      branchDepth = Math.max(branchDepth, distance + 1)
      queue.push(target)
    }
  }
  return { steps: path.length - 1, turns, junctions, deadEnds, branchDepth }
}

export function verifyMaze(grid: MazeGrid) {
  const { width, open, start, goal } = grid
  if (width < 5 || width % 2 !== 1 || open.length !== width ** 2 ||
      start !== width + 1 || goal !== (width - 2) * width + width - 2) return null
  let count = 0
  for (let cell = 0; cell < open.length; cell++) {
    const row = Math.floor(cell / width)
    const col = cell % width
    const border = row === 0 || col === 0 || row === width - 1 || col === width - 1
    const center = row % 2 === 1 && col % 2 === 1
    const wall = border || (row % 2 === 0 && col % 2 === 0)
    if ((open[cell] !== 0 && open[cell] !== 1) || (wall && open[cell]) || (center && !open[cell])) return null
    count += open[cell]
  }
  const { parents, visited, edges } = traverse(grid, start)
  if (visited !== count || edges !== count - 1 || parents[goal] < 0) return null
  const solution = pathFrom(parents, start, goal)
  return { solution, metrics: measure(grid, solution) }
}
