import assert from 'node:assert/strict'
import { test } from 'node:test'
import { joystickDirection, repeatSteps } from '../src/maze/joystick.ts'
import { moveMaze, startMaze } from '../src/maze/session.ts'
import { step } from '../src/maze/solver.ts'

test('dead zone, dominant axis, four directions and invalid coordinates', () => {
  assert.equal(joystickDirection(0, 0), null)
  assert.equal(joystickDirection(0.12, -0.2), null)
  assert.equal(joystickDirection(NaN, 1), null)
  assert.equal(joystickDirection(0.8, 0.3), 'right')
  assert.equal(joystickDirection(-0.8, 0.5), 'left')
  assert.equal(joystickDirection(-0.4, -0.8), 'up')
  assert.equal(joystickDirection(0.3, 0.9), 'down')
})

test('holding repeats one step at a time, stops at walls, and cancellation removes pending work', () => {
  const width = 7
  const open = new Uint8Array(width ** 2)
  for (const cell of [8, 9, 10, 17, 24]) open[cell] = 1
  const puzzle = { width, open, start: 8, goal: 24 }
  let session = startMaze(puzzle)
  let pending = null
  const calls = []
  const hold = repeatSteps((direction) => {
    calls.push(direction)
    const next = moveMaze(session, step(puzzle, session.play.position, direction))
    const moved = next !== session
    session = next
    return moved
  }, (callback, delay) => {
    assert.equal(pending, null)
    pending = { callback, delay }
    return () => { pending = null }
  })
  function tick() {
    const { callback } = pending
    pending = null
    callback()
  }
  hold('right')
  assert.equal(session.play.position, 9)
  assert.equal(pending.delay, 250)
  hold('right')
  assert.equal(calls.length, 1)
  tick()
  assert.equal(session.play.position, 10)
  assert.equal(pending.delay, 95)
  tick()
  assert.equal(session.play.position, 10)
  assert.equal(pending, null)
  hold('down')
  assert.equal(session.play.position, 17)
  assert.equal(pending.delay, 250)
  hold(null)
  assert.equal(pending, null)
  assert.deepEqual(session.play.visited, [8, 9, 10, 17])
})
