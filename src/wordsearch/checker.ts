import { steps } from './config.ts'
import type { Puzzle } from './model.ts'

export function lineBetween(size: number, from: number, to: number): number[] {
  if (![from, to].every((cell) => Number.isInteger(cell) && cell >= 0 && cell < size ** 2)) return []
  const dy = Math.floor(to / size) - Math.floor(from / size)
  const dx = to % size - from % size
  if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) return []
  const stride = Math.sign(dy) * size + Math.sign(dx)
  return Array.from({ length: Math.max(Math.abs(dy), Math.abs(dx)) + 1 }, (_, i) => from + i * stride)
}

export function findWord(puzzle: Puzzle, from: number, to: number) {
  const line = lineBetween(puzzle.config.size, from, to)
  if (line.length < 2) return
  return puzzle.placements.find(({ cells }) => cells.length === line.length &&
    ((cells[0] === from && cells.at(-1) === to) || (cells[0] === to && cells.at(-1) === from)))?.word
}

export function verifyPuzzle(puzzle: Puzzle) {
  const { config, letters, placements } = puzzle
  const { size, directions, wordCount } = config
  if (letters.length !== size ** 2 || placements.length !== wordCount ||
      new Set(placements.map(({ word }) => word)).size !== wordCount) return false
  if (config.mode === 'classic' && config.difficulty === 'hard' &&
      new Set(placements.map(({ direction }) => direction)).size !== steps.length) return false
  return placements.every(({ word, cells, direction }) => {
    if (!Number.isInteger(direction) || direction < 0 || direction >= directions || cells.length !== word.length) return false
    let matches = 0
    for (let start = 0; start < letters.length; start++) {
      if (letters[start] !== word[0]) continue
      for (const [index, [dy, dx]] of steps.entries()) {
        const row = Math.floor(start / size)
        const col = start % size
        const endRow = row + dy * (word.length - 1)
        const endCol = col + dx * (word.length - 1)
        if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue
        const stride = dy * size + dx
        let offset = 1
        while (offset < word.length && letters[start + stride * offset] === word[offset]) offset++
        if (offset !== word.length) continue
        if (++matches > 1 || index !== direction || cells.some((cell, i) => cell !== start + i * stride)) return false
      }
    }
    return matches === 1
  })
}
