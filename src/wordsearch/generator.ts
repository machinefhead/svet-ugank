import { alphabet, words } from './words.ts'
import { directions, isLevel, isSeed, presets, puzzleId, type Direction, type Level, type Placement, type Puzzle } from './model.ts'

function randomFrom(seed: number) {
  return (max: number) => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0
    return Math.floor(seed / 0x100000000 * max)
  }
}

function shuffle<T>(items: readonly T[], random: (max: number) => number): T[] {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = random(i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function paths(size: number, length: number, steps: readonly Direction[]) {
  const result: number[][] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (const [dr, dc] of steps) {
        const lastRow = row + (length - 1) * dr
        const lastCol = col + (length - 1) * dc
        if (lastRow < 0 || lastRow >= size || lastCol < 0 || lastCol >= size) continue
        result.push(Array.from({ length }, (_, i) => (row + i * dr) * size + col + i * dc))
      }
    }
  }
  return result
}

export function generatePuzzle(level: Level, seed: number): Puzzle {
  if (!isLevel(level) || !isSeed(seed)) throw new RangeError('Neveljavne nastavitve osmosmerke.')
  const { size, count, min, max, overlap } = presets[level]
  const random = randomFrom(seed)
  const pool = words.filter((word) => word.length >= min && word.length <= max && word !== [...word].reverse().join(''))
  const lengths = new Map<number, number[][]>()
  for (let length = min; length <= max; length++) lengths.set(length, paths(size, length, directions))

  for (let attempt = 0; attempt < 80; attempt++) {
    const chosen: string[] = []
    // Include a word with a Slovenian diacritic, then avoid contained words and their reverses.
    const candidates = shuffle(pool, random)
    const first = candidates.find((word) => /[ČŠŽ]/u.test(word))
    if (!first) break
    chosen.push(first)
    for (const word of candidates) {
      const reverse = [...word].reverse().join('')
      if (chosen.some((other) => other.includes(word) || word.includes(other) ||
        other.includes(reverse) || reverse.includes(other))) continue
      chosen.push(word)
      if (chosen.length === count) break
    }
    if (chosen.length !== count) continue
    chosen.sort((a, b) => b.length - a.length)

    const letters = Array<string>(size ** 2).fill('')
    const placements: Placement[] = []
    const steps = shuffle(directions, random)
    for (const [i, word] of chosen.entries()) {
      const options = i < steps.length ? paths(size, word.length, [steps[i]]) : lengths.get(word.length)!
      let best = -Infinity
      let matches: number[][] = []
      for (const cells of options) {
        if (!cells.every((cell, j) => !letters[cell] || letters[cell] === word[j])) continue
        const score = overlap * cells.filter((cell) => letters[cell]).length
        if (score > best) {
          best = score
          matches = [cells]
        } else if (score === best) matches.push(cells)
      }
      if (!matches.length) break
      const cells = matches[random(matches.length)]
      cells.forEach((cell, j) => { letters[cell] = word[j] })
      placements.push({ word, cells })
    }
    if (placements.length !== count) continue

    for (let fill = 0; fill < 12; fill++) {
      const grid = letters.map((letter) => letter || alphabet[random(alphabet.length)])
      // Accidental copies would look valid to players. Only publish boards with one path per target.
      if (placements.every(({ word }) => lengths.get(word.length)!
        .filter((cells) => cells.every((cell, i) => grid[cell] === word[i])).length === 1)) {
        return {
          id: puzzleId(level, seed), level, size, letters: grid,
          placements: placements.sort((a, b) => a.word.localeCompare(b.word, 'sl')),
        }
      }
    }
  }
  throw new RangeError('Uganke s temi nastavitvami ni bilo mogoče sestaviti.')
}
