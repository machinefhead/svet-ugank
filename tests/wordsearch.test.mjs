import assert from 'node:assert/strict'
import { test } from 'node:test'
import { findWord, isComplete, lineBetween } from '../src/wordsearch/checker.ts'
import { generateGrid, generatePuzzle } from '../src/wordsearch/generator.ts'
import { alphabet, words } from '../src/wordsearch/words.ts'
import { directions, presets } from '../src/wordsearch/model.ts'
import { selectWord, startPuzzle, useHint } from '../src/wordsearch/session.ts'

test('101 seeds per level respect the preset, return unique answers, and vary layouts', (t) => {
  for (const [level, preset] of Object.entries(presets)) {
    const seeds = [...Array.from({ length: 100 }, (_, i) => i), 0xffffffff]
    const layoutSignatures = new Set()
    const counts = Array(directions.length).fill(0)
    let overlapTotal = 0, densityTotal = 0, maxMs = 0, allDirections = 0
    const started = performance.now()
    for (const seed of seeds) {
      const before = performance.now()
      const puzzle = generatePuzzle(level, seed)
      maxMs = Math.max(maxMs, performance.now() - before)
      if (seed === 0 || seed === 51 || seed === 0xffffffff) assert.deepEqual(generatePuzzle(level, seed), puzzle)
      assert.equal(puzzle.size, preset.size)
      assert.equal(puzzle.letters.length, preset.size ** 2)
      assert.ok(puzzle.letters.every((letter) => letter.length === 1 && alphabet.includes(letter)))
      assert.equal(puzzle.placements.length, preset.wordCount)
      assert.ok(puzzle.placements.some(({ word }) => /[ČŠŽ]/u.test(word)))
      const used = new Set()
      const occupied = new Set()
      let totalLetters = 0, diagonals = 0, backwards = 0
      const row = (cell) => Math.floor(cell / puzzle.size)
      const col = (cell) => cell % puzzle.size
      for (const [index, { word, cells }] of puzzle.placements.entries()) {
        assert.ok(words.includes(word))
        assert.ok(word.length >= preset.minLength && word.length <= preset.maxLength)
        for (const { word: other } of puzzle.placements.slice(index + 1)) {
          for (const form of [other, [...other].reverse().join('')]) {
            assert.ok(!word.includes(form) && !form.includes(word))
          }
        }
        assert.equal(cells.map((cell) => puzzle.letters[cell]).join(''), word)
        const start = cells[0]
        const end = cells.at(-1)
        assert.deepEqual(cells, lineBetween(puzzle.size, start, end))
        assert.equal(findWord(puzzle, start, end), word)
        assert.equal(findWord(puzzle, end, start), word)
        const step = [row(cells[1]) - row(start), col(cells[1]) - col(start)]
        assert.ok(preset.allowedDirections.some((direction) => String(direction) === String(step)))
        const direction = directions.findIndex((direction) => String(direction) === String(step))
        counts[direction]++
        used.add(direction)
        diagonals += Number(step.every(Boolean))
        backwards += Number(direction >= 4)
        totalLetters += cells.length
        cells.forEach((cell) => occupied.add(cell))

        let copies = 0
        for (let r = 0; r < puzzle.size; r++) {
          for (let c = 0; c < puzzle.size; c++) {
            for (const [dr, dc] of directions) {
              if ([...word].every((letter, i) => {
                const y = r + i * dr, x = c + i * dc
                return y >= 0 && y < puzzle.size && x >= 0 && x < puzzle.size &&
                  puzzle.letters[y * puzzle.size + x] === letter
              })) copies++
            }
          }
        }
        assert.equal(copies, 1, puzzle.id + ': ' + word)
      }
      const overlap = totalLetters - occupied.size
      assert.ok(overlap >= preset.overlap.min && overlap <= preset.overlap.max)
      assert.ok(used.size >= preset.minDirections && diagonals >= preset.minDiagonals && backwards >= preset.minReverse)
      allDirections += Number(used.size === directions.length)
      overlapTotal += overlap
      densityTotal += occupied.size / puzzle.letters.length
      layoutSignatures.add(puzzle.placements.map(({ cells }) => cells.join(',')).sort().join('|'))
    }
    assert.ok(layoutSignatures.size >= 95)
    assert.equal(counts.filter(Boolean).length, preset.allowedDirections.length)
    assert.ok(allDirections < seeds.length)
    const totalWords = seeds.length * preset.wordCount
    assert.ok(counts.filter(Boolean).every((count) => count / totalWords >= 0.05))
    t.diagnostic(JSON.stringify({
      level, samples: seeds.length, layouts: layoutSignatures.size, counts, allDirections,
      diagonalPct: Math.round((counts[2] + counts[3] + counts[6] + counts[7]) / totalWords * 100),
      reversePct: Math.round(counts.slice(4).reduce((a, b) => a + b) / totalWords * 100),
      overlap: (overlapTotal / seeds.length).toFixed(2), densityPct: (100 * densityTotal / seeds.length).toFixed(1),
      maxMs: maxMs.toFixed(1), sampleMs: (performance.now() - started).toFixed(0),
    }))
  }
})

test('custom configuration accepts independent axes and rejects invalid or impossible layouts', () => {
  const config = {
    ...presets.beginner, size: 5, wordCount: 1, allowedDirections: [[0, -1]],
    overlap: { min: 0, target: 0, max: 0 }, filler: 'dictionary', minDirections: 1, minReverse: 1,
  }
  const grid = generateGrid(config, 6)
  const { cells } = grid.placements[0]
  assert.equal(cells[1], cells[0] - 1)
  assert.throws(() => generateGrid({ ...config, size: 200 }, 0), /Neveljavne nastavitve/)
  assert.throws(() => generateGrid({ ...config, minDiagonals: 1 }, 0), /ni bilo mogoče sestaviti/)
  // Area is sufficient, but two length-four words cannot cross using only one direction.
  assert.throws(() => generateGrid({ ...config, minLength: 4, wordCount: 2,
    overlap: { min: 1, target: 1, max: 1 } }, 0), /ni bilo mogoče sestaviti/)
})

test('invalid settings and selections are rejected, including row wrap', () => {
  for (const [level, seed] of [['3×3 s 100 besedami', 0], ['toString', 0], ['easy', -1], ['hard', Infinity]]) {
    assert.throws(() => generatePuzzle(level, seed), RangeError)
  }
  const puzzle = generatePuzzle('easy', 12)
  for (const [from, to] of [[-1, 3], [7, 8], [0, 10], [0, 64], [0.5, 2]]) {
    assert.deepEqual(lineBetween(puzzle.size, from, to), [])
    assert.equal(findWord(puzzle, from, to), undefined)
  }
  assert.equal(findWord(puzzle, 1, 1), undefined)
})

test('every word must be found; repeated selections or completion cannot change progress', () => {
  const puzzle = generatePuzzle('medium', 314)
  let play = startPuzzle('medium', 314, 100)
  play = useHint(puzzle, play)
  play = useHint(puzzle, play)
  assert.equal(play.hints.length, 2)
  assert.equal(useHint(puzzle, play), play)
  assert.deepEqual(play.found, [])
  assert.equal(selectWord(puzzle, play, 0, 12).status, 'invalid')
  for (const [index, { cells }] of puzzle.placements.entries()) {
    assert.equal(isComplete(puzzle, play.found), false)
    const move = selectWord(puzzle, play, cells.at(-1), cells[0])
    play = move.play
    const complete = index === puzzle.placements.length - 1
    assert.equal(move.status, complete ? 'complete' : 'found')
    const repeat = selectWord(puzzle, play, cells[0], cells.at(-1))
    assert.equal(repeat.status, complete ? 'closed' : 'already-found')
    assert.equal(repeat.play, play)
  }
})
