import type { Direction } from './model.ts'

const deadZone = 0.28

export function joystickDirection(x: number, y: number): Direction | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || Math.hypot(x, y) < deadZone) return null
  if (Math.abs(x) >= Math.abs(y)) return x > 0 ? 'right' : 'left'
  return y > 0 ? 'down' : 'up'
}

type Schedule = (callback: () => void, delay: number) => () => void

export function repeatSteps(move: (direction: Direction) => boolean, schedule: Schedule) {
  let direction: Direction | null = null
  let cancel: (() => void) | undefined

  function next(held: Direction, delay: number) {
    if (direction === held && move(held) && direction === held) {
      cancel = schedule(() => next(held, 95), delay)
    }
  }

  return (value: Direction | null) => {
    if (direction === value) return
    cancel?.()
    cancel = undefined
    direction = value
    if (value) next(value, 250)
  }
}

export function bindJoystick(base: HTMLElement, move: (direction: Direction) => boolean, signal: AbortSignal) {
  const thumb = base.querySelector<HTMLElement>('.joystick-thumb')!
  const setDirection = repeatSteps(move, (callback, delay) => {
    const timer = window.setTimeout(callback, delay)
    return () => window.clearTimeout(timer)
  })
  let pointer: number | null = null

  function update(event: PointerEvent) {
    const bounds = base.getBoundingClientRect()
    const radius = bounds.width / 2
    if (radius <= 0) return
    const x = (event.clientX - bounds.left - radius) / radius
    const y = (event.clientY - bounds.top - radius) / radius
    const distance = Math.max(1, Math.hypot(x, y))
    const reach = Math.max(0, radius - thumb.offsetWidth / 2 - 4)
    thumb.style.transform = `translate(${reach * x / distance}px, ${reach * y / distance}px)`
    setDirection(joystickDirection(x, y))
  }

  function stop() {
    const held = pointer
    pointer = null
    setDirection(null)
    thumb.style.transform = ''
    if (held !== null && base.hasPointerCapture(held)) base.releasePointerCapture(held)
  }

  base.addEventListener('pointerdown', (event) => {
    if (pointer !== null || event.button !== 0) return
    pointer = event.pointerId
    base.setPointerCapture(pointer)
    base.focus({ preventScroll: true })
    update(event)
    event.preventDefault()
  }, { signal })
  base.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) update(event)
  }, { signal })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    base.addEventListener(type, (event) => {
      if (event.pointerId === pointer) stop()
    }, { signal })
  }
  base.addEventListener('blur', stop, { signal })
  window.addEventListener('blur', stop, { signal })
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop() }, { signal })
  signal.addEventListener('abort', stop, { once: true })
  return stop
}
