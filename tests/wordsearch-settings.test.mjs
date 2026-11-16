import assert from 'node:assert/strict'
import { test } from 'node:test'
import { configuredGenerator, generateConfiguredPuzzle } from '../src/wordsearch/generator.ts'
import { customSizes, customDirections } from '../src/wordsearch/model.ts'
import { findWord } from '../src/wordsearch/checker.ts'

test('independent sizes and directions produce verified, repeatable puzzles', () => {
  for (const size of customSizes) {
    for (const directions of customDirections) {
      const options = { size, directions, quantity: 'normal' }
      for (const level of ['beginner', 'easy', 'medium']) {
        const config = configuredGenerator(level, options)
        assert.equal(config.size, size)
        assert.equal(config.allowedDirections.length, directions)
        for (const seed of [1, 7, 123]) {
          const puzzle = generateConfiguredPuzzle(level, options, seed)
          assert.deepEqual(generateConfiguredPuzzle(level, options, seed), puzzle)
          assert.equal(puzzle.letters.length, size ** 2)
          assert.equal(puzzle.placements.length, config.wordCount)
          for (const { word, cells } of puzzle.placements) {
            assert.equal(cells.map((cell) => puzzle.letters[cell]).join(''), word)
            assert.equal(findWord(puzzle, cells[0], cells.at(-1)), word)
            assert.equal(findWord(puzzle, cells.at(-1), cells[0]), word)
          }
        }
      }
    }
  }
})

test('word amount remains independent of difficulty and direction limits', () => {
  const few = { size: 8, directions: 4, quantity: 'few' }
  const many = { ...few, quantity: 'many' }
  assert.ok(configuredGenerator('easy', few).wordCount < configuredGenerator('easy', many).wordCount)
  const a = generateConfiguredPuzzle('easy', few, 91)
  const b = generateConfiguredPuzzle('easy', many, 91)
  assert.notEqual(a.id, b.id)
})
