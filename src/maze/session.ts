import type { MazePuzzle } from './model.ts'
import { canMove, solveMaze } from './solver.ts'

export interface MazePlay {
  position: number
  visited: readonly number[]
  steps: number
  hints: number
  startedAt: number
  finishedAt: number | null
  revealed: boolean
}

export function startMaze(puzzle: MazePuzzle, now: number): MazePlay {
  return { position: puzzle.start, visited: [puzzle.start], steps: 0, hints: 0,
    startedAt: now, finishedAt: null, revealed: false }
}

export function restartMaze(puzzle: MazePuzzle, play: MazePlay, now: number): MazePlay {
  return { ...startMaze(puzzle, now), hints: play.hints, revealed: play.revealed }
}

export function moveMaze(puzzle: MazePuzzle, play: MazePlay, to: number, now: number): MazePlay {
  if (play.finishedAt !== null || !canMove(puzzle, play.position, to)) return play
  return {
    ...play,
    position: to,
    visited: play.visited.includes(to) ? play.visited : [...play.visited, to],
    steps: play.steps + 1,
    finishedAt: to === puzzle.goal ? Math.max(now, play.startedAt) : null,
  }
}

export function hintMaze(puzzle: MazePuzzle, play: MazePlay) {
  if (play.finishedAt !== null) return null
  const next = solveMaze(puzzle, play.position, puzzle.goal)[1]
  return next === undefined ? null : { next, play: { ...play, hints: play.hints + 1 } }
}
