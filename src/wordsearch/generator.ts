import { generateLegacyPuzzle } from './generator-v1.ts'
import {
  directions, isLevel, isLevelForRevision, isSeed, presets, puzzleId, revision,
  type Direction, type GeneratorConfig, type Placement, type Puzzle, type Revision, type WordsearchOptions,
} from './model.ts'
import { alphabet, words } from './words.ts'

const beamWidth = 5
const layoutsPerRound = 2
const searchRounds = 4
const fillAttempts = 5
const settingsError = 'Neveljavne nastavitve osmosmerke.'
const layoutError = 'Uganke s temi nastavitvami ni bilo mogoče sestaviti. Poskusi znova.'

function randomFrom(seed: number) {
  return () => {
    seed = (seed + 0x9e3779b9) >>> 0
    let value = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad)
    value = Math.imul(value ^ (value >>> 15), 0x735a2d97)
    return ((value ^ (value >>> 15)) >>> 0) / 0x100000000
  }
}

type Random = ReturnType<typeof randomFrom>

interface Path {
  readonly cells: readonly number[]
  readonly direction: number
  readonly quadrant: number
}

function paths(size: number, length: number) {
  const options: Path[] = []
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (const [direction, [dr, dc]] of directions.entries()) {
        const endRow = row + (length - 1) * dr
        const endCol = col + (length - 1) * dc
        if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) continue
        const cells = Array.from({ length }, (_, i) => (row + i * dr) * size + col + i * dc)
        const quadrant = 2 * Number(row + endRow >= size - 1) + Number(col + endCol >= size - 1)
        options.push({ cells, direction, quadrant })
      }
    }
  }
  return options
}

const reverse = (word: string) => [...word].reverse().join('')
const diacritic = /[ČŠŽ]/u
const diagonal = (index: number) => directions[index].every((step) => step !== 0)
const directionIndex = ([row, col]: Direction) => directions.findIndex(([dr, dc]) => row === dr && col === dc)

function chooseWords(pool: readonly string[], count: number, random: Random) {
  const ordered = [...pool]
  for (let i = ordered.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
  }
  const first = ordered.find((word) => diacritic.test(word))
  if (!first) return []
  const chosen: string[] = [first]
  for (const word of ordered) {
    if (chosen.length === count) break
    const backwards = reverse(word)
    if (!chosen.some((other) => [word, backwards].some((form) => form.includes(other) || other.includes(form)))) {
      chosen.push(word)
    }
  }
  return chosen.sort((a, b) => b.length - a.length)
}

interface Layout {
  readonly letters: readonly string[]
  readonly placements: readonly Placement[]
  readonly uses: readonly number[]
  readonly quadrants: readonly number[]
  readonly distinct: number
  readonly diagonals: number
  readonly backwards: number
  readonly overlap: number
  readonly score: number
}

function crossings(letters: readonly string[], word: string, cells: readonly number[]) {
  let overlap = 0
  for (const [i, cell] of cells.entries()) {
    if (!letters[cell]) continue
    if (letters[cell] !== word[i]) return -1
    overlap++
  }
  return overlap
}

function placeWords(chosen: readonly string[], options: ReadonlyMap<number, Path[]>, config: GeneratorConfig, random: Random) {
  let beam: Layout[] = [{
    letters: Array<string>(config.size ** 2).fill(''), placements: [], uses: Array<number>(8).fill(0),
    quadrants: [0, 0, 0, 0], distinct: 0, diagonals: 0, backwards: 0, overlap: 0, score: 0,
  }]

  // Linear space per depth: keep alternatives alive when the best partial layout later gets stuck.
  for (const [depth, word] of chosen.entries()) {
    const remaining = chosen.length - depth - 1
    const target = config.overlap.target * (depth + 1) / chosen.length
    const next: Layout[] = []
    for (const parent of beam) {
      const spread = parent.quadrants.reduce((sum, count) => sum + count ** 2, 0)
      const repeated = parent.uses.reduce((sum, count) => sum + Math.max(0, count - 2) ** 2, 0)
      for (const { cells, direction, quadrant } of options.get(word.length)!) {
        const shared = crossings(parent.letters, word, cells)
        const overlap = parent.overlap + shared
        if (shared < 0 || overlap > config.overlap.max || (!remaining && overlap < config.overlap.min)) continue
        const distinct = parent.distinct + Number(parent.uses[direction] === 0)
        const diagonals = parent.diagonals + Number(diagonal(direction))
        const backwards = parent.backwards + Number(direction >= 4)
        if (distinct + remaining < config.minDirections || diagonals + remaining < config.minDiagonals ||
            backwards + remaining < config.minReverse) continue

        const concentration = spread + 2 * parent.quadrants[quadrant] + 1
        const repetition = repeated + Math.max(0, 2 * parent.uses[direction] - 3)
        const score = -2 * Math.abs(overlap - target) - 0.35 * concentration - 0.65 * repetition + 2 * random()
        if (next.length === beamWidth && score <= next[beamWidth - 1].score) continue

        const letters = [...parent.letters]
        cells.forEach((cell, i) => { letters[cell] = word[i] })
        const uses = [...parent.uses]
        uses[direction]++
        const quadrants = [...parent.quadrants]
        quadrants[quadrant]++
        next.push({
          letters, placements: [...parent.placements, { word, cells }], uses, quadrants,
          distinct, diagonals, backwards, overlap, score,
        })
        next.sort((a, b) => b.score - a.score)
        if (next.length > beamWidth) next.pop()
      }
    }
    beam = next
    if (!beam.length) break
  }
  return beam
}

type Grid = Pick<Puzzle, 'size' | 'letters' | 'placements'>

// The validated limits also bound work for future callers using custom combinations.
export function generateGrid(config: GeneratorConfig, seed: number): Grid {
  const { size, wordCount, minLength, maxLength, overlap, filler, minDirections, minDiagonals, minReverse } = config
  if (!isSeed(seed) || ![size, wordCount, minLength, maxLength, overlap.min, overlap.target, overlap.max,
    minDirections, minDiagonals, minReverse].every(Number.isInteger) ||
    size < 3 || size > 16 || wordCount < 1 || wordCount > 16 || minLength < 3 || maxLength < minLength ||
    maxLength > size || overlap.min < 0 || overlap.min > overlap.target || overlap.target > overlap.max ||
    overlap.max >= wordCount * maxLength || minDirections < 1 || minDiagonals < 0 || minReverse < 0 ||
    (filler !== 'uniform' && filler !== 'dictionary')) throw new RangeError(settingsError)

  const allowed = new Set(config.allowedDirections.map(directionIndex))
  if (!allowed.size || allowed.has(-1) || allowed.size !== config.allowedDirections.length) throw new RangeError(settingsError)
  const directionList = [...allowed]
  if (minDirections > Math.min(allowed.size, wordCount) || minDiagonals > wordCount || minReverse > wordCount ||
    (minDiagonals && !directionList.some(diagonal)) || (minReverse && !directionList.some((index) => index >= 4)) ||
    minLength * wordCount - overlap.max > size ** 2) throw new RangeError(layoutError)

  const pool = words.filter((word) => word.length >= minLength && word.length <= maxLength && word !== reverse(word))
  if (pool.length < wordCount || !pool.some((word) => diacritic.test(word))) throw new RangeError(layoutError)
  const allPaths = new Map<number, Path[]>()
  const options = new Map<number, Path[]>()
  for (let length = minLength; length <= maxLength; length++) {
    const entries = paths(size, length)
    allPaths.set(length, entries)
    options.set(length, entries.filter(({ direction }) => allowed.has(direction)))
  }
  const random = randomFrom(seed)
  const fillerLetters = filler === 'uniform' ? alphabet : words.join('')
  for (let round = 0; round < searchRounds; round++) {
    const candidates: Layout[] = []
    for (let attempt = 0; attempt < layoutsPerRound; attempt++) {
      const chosen = chooseWords(pool, wordCount, random)
      if (chosen.length === wordCount) candidates.push(...placeWords(chosen, options, config, random))
    }
    for (const { letters, placements } of candidates.sort((a, b) => b.score - a.score)) {
      for (let fill = 0; fill < fillAttempts; fill++) {
        const filled = letters.map((letter) => letter || fillerLetters[Math.floor(random() * fillerLetters.length)])
        // Include reverse reading and directions unavailable for intentional placement.
        if (placements.every(({ word, cells }) => allPaths.get(word.length)!.every((path) =>
          path.cells[0] === cells[0] && path.cells.at(-1) === cells.at(-1) ||
          !path.cells.every((cell, i) => filled[cell] === word[i]),
        ))) {
          return { size, letters: filled, placements }
        }
      }
    }
  }
  throw new RangeError(layoutError)
}

export function generatePuzzle(level: unknown, seed: number, rev: Revision = revision): Puzzle {
  if (rev === 1 && isLevelForRevision(level, 1)) return generateLegacyPuzzle(level, seed)
  if (rev !== revision || !isLevel(level)) throw new RangeError(settingsError)
  return { id: puzzleId(level, seed), revision, level, ...generateGrid(presets[level], seed) }
}

// The independently selectable options are used only for *new* puzzles.
// Historical R1/R2 seeds still regenerate with their original exact rules.
export function configuredGenerator(level: 'beginner' | 'easy' | 'medium', options: WordsearchOptions): GeneratorConfig {
  if (!isLevel(level) || ![6, 8, 10, 12].includes(options.size) ||
      ![2, 4, 8].includes(options.directions) ||
      !['few', 'normal', 'many'].includes(options.quantity)) {
    throw new RangeError(settingsError)
  }
  const size = options.size
  const base = level === 'beginner' ? Math.round(size * .52) :
    level === 'easy' ? Math.round(size * .7) : Math.round(size * .85)
  const offset = options.quantity === 'few' ? -1 : options.quantity === 'many' ? 1 : 0
  const wordCount = Math.min(16, Math.max(3, base + offset))
  const maxLength = Math.min(size, level === 'beginner' ? 5 : level === 'easy' ? 6 : 7)
  const minLength = level === 'medium' && size >= 8 ? 4 : 3
  const maxOverlap = level === 'beginner' ? 1 : level === 'easy' ? 3 : 5
  return {
    size, wordCount, minLength, maxLength,
    allowedDirections: directions.slice(0, options.directions),
    overlap: { min: 0, target: level === 'medium' ? 2 : level === 'easy' ? 1 : 0, max: maxOverlap },
    filler: level === 'medium' ? 'dictionary' : 'uniform',
    minDirections: Math.min(wordCount, options.directions, level === 'medium' ? 4 : level === 'easy' ? 3 : 2),
    minDiagonals: options.directions >= 4 ? (level === 'medium' ? 2 : 1) : 0,
    minReverse: options.directions === 8 ? (level === 'medium' ? 2 : 1) : 0,
  }
}

export function generateConfiguredPuzzle(level: 'beginner' | 'easy' | 'medium', options: WordsearchOptions,
  seed: number): Puzzle {
  if (!isSeed(seed)) throw new RangeError(settingsError)
  const config = configuredGenerator(level, options)
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      // The bounded alternate-seed search is reproducible from the original ID.
      const alternative = (seed + Math.imul(attempt, 0x9e3779b9)) >>> 0
      return {
        id: puzzleId(level, seed, revision, options), revision, level, options: { ...options },
        ...generateGrid(config, alternative),
      }
    } catch (error) {
      if (!(error instanceof RangeError) || attempt === 7) throw error
    }
  }
  throw new RangeError(layoutError)
}
