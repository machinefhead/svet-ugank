import { findWord, isComplete } from './checker.ts'
import { hintLimit, puzzleId, revision, type Level, type PlayState, type Puzzle, type PuzzleLevel, type Revision, type WordsearchOptions } from './model.ts'

export interface Result {
  readonly puzzleId: string
  readonly revision: Revision
  readonly level: PuzzleLevel
  readonly finishedAt: number
  readonly elapsedMs: number
  readonly hints: number
  readonly options?: WordsearchOptions
}

export function startPuzzle(level: Level, seed: number, now: number, options?: WordsearchOptions): PlayState {
  return { revision, level, seed, startedAt: now, found: [], hints: [], revealed: false,
    ...(options ? { options: { ...options } } : {}) }
}

export function selectWord(puzzle: Puzzle, play: PlayState, from: number, to: number) {
  if (puzzle.id !== puzzleId(play.level, play.seed, play.revision, play.options) || play.revealed || isComplete(puzzle, play.found)) {
    return { play, status: 'closed' as const }
  }
  const word = findWord(puzzle, from, to)
  if (!word) return { play, status: 'invalid' as const }
  if (play.found.includes(word)) return { play, status: 'already-found' as const, word }
  const next = { ...play, found: [...play.found, word] }
  return { play: next, status: isComplete(puzzle, next.found) ? 'complete' as const : 'found' as const, word }
}

export function useHint(puzzle: Puzzle, play: PlayState): PlayState {
  if (play.revealed || play.hints.length >= hintLimit || puzzle.id !== puzzleId(play.level, play.seed, play.revision, play.options)) return play
  const next = puzzle.placements.find(({ word }) => !play.found.includes(word) && !play.hints.includes(word))
  return next ? { ...play, hints: [...play.hints, next.word] } : play
}

export function recordResult(results: readonly Result[], puzzle: Puzzle, play: PlayState, now: number) {
  if (play.revealed || puzzle.id !== puzzleId(play.level, play.seed, play.revision, play.options) || !isComplete(puzzle, play.found) ||
      results.some((result) => result.puzzleId === puzzle.id)) return results
  const finishedAt = Math.max(play.startedAt, now)
  return [...results, {
    puzzleId: puzzle.id, revision: puzzle.revision, level: play.level, finishedAt,
    elapsedMs: finishedAt - play.startedAt, hints: play.hints.length,
    ...(play.options ? { options: play.options } : {}),
  }]
}
