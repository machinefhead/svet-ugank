import { isSeed } from '../random.ts'
import { record } from '../storage.ts'
import { findWord } from './checker.ts'
import { isConfig } from './config.ts'
import { generatePuzzle } from './generator.ts'
import { hintLimit, revision, type Puzzle } from './model.ts'

export interface PlayState {
  readonly found: readonly string[]
  readonly hinted: readonly string[]
}

export interface Session {
  readonly puzzle: Puzzle
  readonly play: PlayState
}

export const complete = ({ puzzle, play }: Session) => play.found.length === puzzle.placements.length

export function selectWord(session: Session, from: number, to: number) {
  if (complete(session)) return { status: 'closed' as const }
  const word = findWord(session.puzzle, from, to)
  if (!word) return { status: 'invalid' as const }
  if (session.play.found.includes(word)) return { status: 'already-found' as const, word }
  return { status: 'found' as const, word, play: { ...session.play, found: [...session.play.found, word] } }
}

const orientations = ['vodoravno', 'navpično', 'poševno', 'poševno', 'vodoravno', 'navpično', 'poševno', 'poševno']

export function nextHint({ puzzle, play }: Session) {
  if (play.hinted.length >= hintLimit) return
  const missing = puzzle.placements.filter(({ word }) => !play.found.includes(word))
  const target = missing.find(({ word }) => !play.hinted.includes(word))
  if (!target) return
  const orientation = orientations[target.direction]
  // When only one word remains, withhold the hint rather than identify its orientation.
  if (missing.length < 2) return
  return { orientation, play: { ...play, hinted: [...play.hinted, target.word] } }
}

export function encodeSession({ puzzle, play }: Session) {
  return { revision, id: puzzle.id, config: puzzle.config, seed: puzzle.seed, found: play.found, hinted: play.hinted }
}

export function decodeSession(value: unknown): Session | null {
  const entry = record(value)
  if (entry?.revision !== revision || !isConfig(entry.config) || !isSeed(entry.seed)) return null
  const puzzle = generatePuzzle(entry.config, entry.seed)
  const allowed = new Set(puzzle.placements.map(({ word }) => word))
  const { found, hinted } = entry
  const validWords = (list: unknown): list is string[] =>
    Array.isArray(list) && list.length <= allowed.size && new Set(list).size === list.length &&
    list.every((word) => allowed.has(word))
  if (puzzle.id !== entry.id || !validWords(found) || !validWords(hinted) || hinted.length > hintLimit) return null
  return { puzzle, play: { found, hinted } }
}
