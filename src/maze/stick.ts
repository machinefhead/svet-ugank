import type { Direction } from './model.ts'

// A small centre dead zone prevents unwanted moves while resting a thumb.
// The grid itself remains a four-direction game: a diagonal thumb position
// resolves to whichever cardinal axis has the greater displacement.
export function stickDirection(x: number, y: number, deadZone: number): Direction | null {
  if (![x, y, deadZone].every(Number.isFinite) || deadZone < 0) return null
  if (Math.hypot(x, y) < deadZone) return null
  if (Math.abs(x) >= Math.abs(y)) return x >= 0 ? 'right' : 'left'
  return y >= 0 ? 'down' : 'up'
}

export function stickDisplacement(x: number, y: number, radius: number) {
  if (![x, y, radius].every(Number.isFinite) || radius <= 0) return { x: 0, y: 0 }
  const distance = Math.hypot(x, y)
  const scale = distance > radius ? radius / distance : 1
  return { x: x * scale, y: y * scale }
}
