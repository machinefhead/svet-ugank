import { canMove } from './solver.ts'
import type { MazePuzzle } from './model.ts'

export interface PointerPoint {
  readonly x: number
  readonly y: number
}

// Sample the actual finger/mouse segment, rather than assuming each pointermove
// arrives on an adjacent tile. Never infer a turn that the pointer did not trace.
export function cellsAlongSegment(width: number, cellSize: number, from: PointerPoint, to: PointerPoint): number[] {
  if (!Number.isInteger(width) || width < 1 || !Number.isFinite(cellSize) || cellSize <= 0 ||
      ![from.x, from.y, to.x, to.y].every(Number.isFinite)) return []
  const dx = to.x - from.x
  const dy = to.y - from.y
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (cellSize / 3)))
  const cells: number[] = []
  for (let i = 0; i <= steps; i++) {
    const x = from.x + dx * i / steps
    const y = from.y + dy * i / steps
    if (x < 0 || y < 0 || x >= cellSize * width || y >= cellSize * width) continue
    const cell = Math.floor(y / cellSize) * width + Math.floor(x / cellSize)
    if (cells.at(-1) !== cell) cells.push(cell)
  }
  return cells
}

// Stop at the first wall, diagonal jump or discontinuity. A fast swipe along
// an unobstructed corridor may cross several adjacent cells safely.
export function legalDragSteps(grid: Pick<MazePuzzle, 'width' | 'open'>, from: number, cells: readonly number[]) {
  const moves: number[] = []
  let current = from
  for (const cell of cells) {
    if (cell === current) continue
    if (!canMove(grid, current, cell)) break
    moves.push(cell)
    current = cell
  }
  return moves
}
