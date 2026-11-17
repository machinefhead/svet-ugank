import { isSeed, seededRandom } from '../random.ts'
import { complexity, configIssue, isConfig, steps, type Config } from './config.ts'
import { verifyPuzzle } from './checker.ts'
import { puzzleId, type Placement, type Puzzle } from './model.ts'
import { alphabet, words } from './words.ts'

const attempts = 32
const fillsPerLayout = 8
const lettersInWords = words.join('')
const diacritic = /[ČŠŽ]/u
const reverse = (word: string) => Array.from(word).reverse().join('')

function chooseWords(config: Config, random: () => number) {
  const rule = complexity[config.difficulty]
  const pool: string[] = words.filter((word) => word.length >= rule.min && word.length <= Math.min(rule.max, config.size) &&
    word !== reverse(word))
  const chosen: string[] = []
  while (chosen.length < config.wordCount) {
    let best = ''
    let bestScore = -Infinity
    for (const word of pool) {
      if (!chosen.length && !diacritic.test(word)) continue
      const backwards = reverse(word)
      if (chosen.some((other) => [word, backwards].some((candidate) =>
        candidate.includes(other) || other.includes(candidate)))) continue
      const shared = chosen.some((other) => Array.from(word.slice(1)).some((char, i) => other.includes(word[i] + char)))
      const score = random() * 3 + (shared ? rule.similarity : 0)
      if (score > bestScore) {
        best = word
        bestScore = score
      }
    }
    if (!best) return []
    chosen.push(best)
  }
  return chosen.sort((a, b) => b.length - a.length)
}

function place(chosen: string[], config: Config, random: () => number) {
  const { size, directions } = config
  const rule = complexity[config.difficulty]
  const letters: string[] = Array(size ** 2).fill('')
  const directionUse: number[] = Array(directions).fill(0)
  const placements: Placement[] = []
  for (const word of chosen) {
    const needUnused = config.mode === 'classic' && config.difficulty === 'hard' &&
      chosen.length - placements.length === directionUse.filter((uses) => uses === 0).length
    let bestScore = -Infinity
    let best: Placement | undefined
    for (let direction = 0; direction < directions; direction++) {
      if (needUnused && directionUse[direction] > 0) continue
      const [dy, dx] = steps[direction]
      const stride = dy * size + dx
      for (let row = 0; row < size; row++) {
        const endRow = row + dy * (word.length - 1)
        if (endRow < 0 || endRow >= size) continue
        for (let col = 0; col < size; col++) {
          const endCol = col + dx * (word.length - 1)
          if (endCol < 0 || endCol >= size) continue
          const start = row * size + col
          let overlap = 0
          let index = 0
          for (; index < word.length; index++) {
            const current = letters[start + index * stride]
            if (current && current !== word[index]) break
            if (current) overlap++
          }
          if (index !== word.length || overlap === word.length) continue
          const score = random() * 4 + overlap * rule.overlap - directionUse[direction] * 1.3
          if (score <= bestScore) continue
          bestScore = score
          best = { word, direction, cells: Array.from({ length: word.length }, (_, i) => start + i * stride) }
        }
      }
    }
    if (!best) return null
    best.cells.forEach((cell, i) => { letters[cell] = word[i] })
    directionUse[best.direction]++
    placements.push(best)
  }
  return { letters, placements }
}

export function generatePuzzle(config: Config, seed: number): Puzzle {
  if (!isConfig(config) || !isSeed(seed)) throw new RangeError('Neveljavne nastavitve osmosmerke.')
  const issue = configIssue(config)
  if (issue) throw new RangeError(issue)
  const random = seededRandom(seed)
  for (let attempt = 0; attempt < attempts; attempt++) {
    const chosen = chooseWords(config, random)
    if (!chosen.length) break
    const layout = place(chosen, config, random)
    if (!layout) continue
    const filler = complexity[config.difficulty].weightedFill ? chosen.join('') + lettersInWords : alphabet
    for (let fill = 0; fill < fillsPerLayout; fill++) {
      const puzzle = {
        config: { ...config }, seed, id: puzzleId(config, seed),
        placements: layout.placements,
        letters: layout.letters.map((letter) => letter || filler[Math.floor(random() * filler.length)]),
      }
      if (verifyPuzzle(puzzle)) return puzzle
    }
  }
  throw new RangeError('S temi nastavitvami uganke ni bilo mogoče sestaviti. Poskusi z manj besedami ali z večjo mrežo.')
}
