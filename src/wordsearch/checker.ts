import type { Puzzle } from './model.ts'

export function lineBetween(size: number, from: number, to: number): number[] {
  if (![from, to].every((cell) => Number.isInteger(cell) && cell >= 0 && cell < size ** 2)) return []
  const rows = Math.floor(to / size) - Math.floor(from / size)
  const cols = to % size - from % size
  if (rows && cols && Math.abs(rows) !== Math.abs(cols)) return []
  const step = Math.sign(rows) * size + Math.sign(cols)
  return Array.from({ length: Math.max(Math.abs(rows), Math.abs(cols)) + 1 }, (_, i) => from + i * step)
}

export function findWord(puzzle: Puzzle, from: number, to: number) {
  const line = lineBetween(puzzle.size, from, to)
  return puzzle.placements.find(({ cells }) => line.length === cells.length && (
    cells.every((cell, i) => cell === line[i]) ||
    cells.every((cell, i) => cell === line[line.length - 1 - i])
  ))?.word
}

export function isComplete(puzzle: Puzzle, found: readonly string[]) {
  return puzzle.placements.every(({ word }) => found.includes(word))
}
