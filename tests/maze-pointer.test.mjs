import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cellsAlongSegment, legalDragSteps } from '../src/maze/pointer.ts'

const width = 7
const size = 20
const point = (x, y) => ({ x: x * size + size / 2, y: y * size + size / 2 })
const grid = (closed = []) => {
  const open = new Uint8Array(width * width).fill(1)
  for (const cell of closed) open[cell] = 0
  return { width, open }
}

test('fast straight drag visits intermediate cells instead of stalling', () => {
  const line = cellsAlongSegment(width, size, point(1, 1), point(5, 1))
  assert.deepEqual(line, [8, 9, 10, 11, 12])
  assert.deepEqual(legalDragSteps(grid(), 8, line), [9, 10, 11, 12])
  const vertical = cellsAlongSegment(width, size, point(5, 1), point(5, 4))
  assert.deepEqual(legalDragSteps(grid(), 12, vertical), [19, 26, 33])
})

test('drag never crosses a wall, diagonal jump or untraced corner', () => {
  const line = cellsAlongSegment(width, size, point(1, 1), point(5, 1))
  assert.deepEqual(legalDragSteps(grid([10]), 8, line), [9])
  assert.deepEqual(legalDragSteps(grid(), 8, [8, 16, 24]), [])
  const diagonal = cellsAlongSegment(width, size, point(1, 1), point(3, 3))
  assert.deepEqual(legalDragSteps(grid(), 8, diagonal), [])
})

test('invalid coordinates and strokes outside the grid cannot teleport', () => {
  assert.deepEqual(cellsAlongSegment(width, size, point(-3, -3), point(-1, -1)), [])
  assert.deepEqual(cellsAlongSegment(width, 0, point(1, 1), point(2, 1)), [])
  assert.deepEqual(legalDragSteps(grid(), 8, [0, 3, 8]), [])
})
