import { isSeed } from '../random.ts'
import { record } from '../storage.ts'
import { generateMaze } from './generator.ts'
import { directions, isConfig, revision, type Direction, type MazePuzzle } from './model.ts'
import { canMove, neighbors, solveMaze, step } from './solver.ts'

export interface MazePlay {
  readonly position: number
  readonly visited: readonly number[]
}

export interface Session {
  readonly puzzle: MazePuzzle
  readonly play: MazePlay
}

export const startMaze = (puzzle: MazePuzzle): Session => ({ puzzle, play: { position: puzzle.start, visited: [puzzle.start] } })
export const complete = ({ puzzle, play }: Session) => play.position === puzzle.goal

export function moveMaze(session: Session, to: number) {
  const { puzzle, play } = session
  if (complete(session) || !canMove(puzzle, play.position, to)) return session
  const visited = play.visited.includes(to) ? play.visited : [...play.visited, to]
  return { puzzle, play: { position: to, visited } }
}

export function hintMaze({ puzzle, play }: Session) {
  const next = solveMaze(puzzle, play.position, puzzle.goal)[1]
  return (Object.keys(directions) as Direction[]).find((direction) => step(puzzle, play.position, direction) === next)
}

export function encodeSession({ puzzle, play }: Session) {
  return { revision, id: puzzle.id, seed: puzzle.seed, config: puzzle.config, position: play.position, visited: play.visited }
}

export function decodeSession(value: unknown): Session | null {
  const entry = record(value)
  if (entry?.revision !== revision || !isConfig(entry.config) || !isSeed(entry.seed)) return null
  const puzzle = generateMaze(entry.config, entry.seed)
  const { position, visited } = entry
  if (puzzle.id !== entry.id || !Array.isArray(visited) || visited[0] !== puzzle.start ||
      visited.length > puzzle.open.length || typeof position !== 'number' || !Number.isInteger(position)) return null
  const known = new Set<number>([puzzle.start])
  for (const cell of visited.slice(1)) {
    if (!Number.isInteger(cell) || puzzle.open[cell] !== 1 || known.has(cell) ||
        !neighbors(puzzle, cell).some((near) => known.has(near))) return null
    known.add(cell)
  }
  if (!known.has(position) || (known.has(puzzle.goal) && (position !== puzzle.goal || visited.at(-1) !== puzzle.goal))) return null
  return { puzzle, play: { position, visited: [...known] } }
}
