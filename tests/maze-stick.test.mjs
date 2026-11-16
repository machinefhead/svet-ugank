import assert from 'node:assert/strict'
import { test } from 'node:test'
import { stickDirection, stickDisplacement } from '../src/maze/stick.ts'

test('virtual thumbstick has a dead zone and selects cardinal directions', () => {
  assert.equal(stickDirection(0, 0, 10), null)
  assert.equal(stickDirection(4, -5, 10), null)
  assert.equal(stickDirection(15, 2, 10), 'right')
  assert.equal(stickDirection(-12, 3, 10), 'left')
  assert.equal(stickDirection(2, -14, 10), 'up')
  assert.equal(stickDirection(4, 16, 10), 'down')
  assert.equal(stickDirection(20, -8, 10), 'right')
  assert.equal(stickDirection(-3, -18, 10), 'up')
  assert.equal(stickDirection(NaN, 10, 5), null)
})

test('thumb position is limited to its circular travel area', () => {
  assert.deepEqual(stickDisplacement(0, 0, 40), { x: 0, y: 0 })
  assert.deepEqual(stickDisplacement(16, -20, 40), { x: 16, y: -20 })
  const point = stickDisplacement(60, 80, 50)
  assert.ok(Math.abs(Math.hypot(point.x, point.y) - 50) < 1e-9)
  assert.deepEqual(stickDisplacement(8, 9, 0), { x: 0, y: 0 })
})
