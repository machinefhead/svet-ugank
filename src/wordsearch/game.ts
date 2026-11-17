import { gameActions, selectField, type GameController, type GameUI } from '../game-ui.ts'
import { newSeed } from '../random.ts'
import { openSlot, readLegacy, savedGameNotice } from '../storage.ts'
import { mountBoard } from './board.ts'
import { classic, configIssue, describe, difficulties, directionCounts, directionLabels, isConfig,
  sizes, type Config, type Difficulty } from './config.ts'
import { generatePuzzle } from './generator.ts'
import { hintLimit } from './model.ts'
import { complete, decodeSession, encodeSession, nextHint, selectWord, type Session } from './session.ts'

export function setupWordsearch(getStorage: () => Storage, ui: GameUI): GameController {
  const slot = openSlot(getStorage, 'wordsearch', decodeSession, encodeSession)
  let session = slot.value
  const hasLegacy = !session && Boolean(readLegacy(getStorage, 'svet-ugank:r2', 'play'))
  let mode = session?.puzzle.config.mode ?? 'classic'
  let difficulty = session?.puzzle.config.mode === 'classic' ? session.puzzle.config.difficulty : 'starter'
  let custom: Config = session?.puzzle.config.mode === 'custom' ? session.puzzle.config :
    { mode: 'custom', difficulty: 'easy', size: 8, directions: 4, wordCount: 6 }

  function save(next: Session) {
    session = next
    slot.save(next)
    ui.storageChanged()
  }

  return {
    get available() { return slot.available },
    get resumable() { return session !== null && !complete(session) },
    get notice() { return savedGameNotice(slot.invalid, session !== null, hasLegacy) },
    settings(fields) {
      const modeField = selectField(fields, 'mode', 'Način', [['classic', 'Klasična'], ['custom', 'Po meri']], mode)
      const classicFields = document.createElement('div')
      const customFields = document.createElement('div')
      classicFields.className = customFields.className = 'settings-fields'
      fields.append(classicFields, customFields)
      const levels = Object.entries(difficulties)
      const level = selectField(classicFields, 'difficulty', 'Težavnost', levels, difficulty)
      const size = selectField(customFields, 'size', 'Velikost mreže', sizes.map((n) => [n, `${n} × ${n}`]), custom.size)
      const directions = selectField(customFields, 'directions', 'Smeri',
        directionCounts.map((n) => [n, `${n} · ${directionLabels[n]}`]), custom.directions)
      const counts = Array.from({ length: 12 }, (_, i) => [i + 3, String(i + 3)] as const)
      const count = selectField(customFields, 'wordCount', 'Število besed', counts, custom.wordCount)
      const issue = document.createElement('p')
      issue.id = 'word-count-issue'
      issue.className = 'field-error'
      issue.setAttribute('role', 'status')
      count.setAttribute('aria-describedby', issue.id)
      count.parentElement?.after(issue)
      const complexity = selectField(customFields, 'complexity', 'Zahtevnost', levels, custom.difficulty)
      const summary = document.createElement('p')
      fields.append(summary)

      function read(): Config {
        if (modeField.value === 'classic') return classic(level.value as Difficulty)
        const picked = { mode: 'custom', difficulty: complexity.value, size: Number(size.value),
          directions: Number(directions.value), wordCount: Number(count.value) }
        if (!isConfig(picked)) throw new RangeError('Preveri nastavitve osmosmerke.')
        return picked
      }
      function preview() {
        const config = read()
        mode = config.mode
        if (mode === 'classic') difficulty = config.difficulty
        else custom = config
        classicFields.hidden = mode !== 'classic'
        customFields.hidden = mode !== 'custom'
        const error = mode === 'custom' ? configIssue(config) : ''
        count.setCustomValidity(error)
        count.setAttribute('aria-invalid', String(Boolean(error)))
        issue.textContent = error
        summary.textContent = mode === 'classic' ? `Prednastavitve so prilagojene stopnji. ${describe(config)}.` : describe(config)
      }
      for (const field of [modeField, level, size, directions, count, complexity]) field.addEventListener('change', preview)
      preview()
      return () => {
        const config = read()
        const seed = newSeed()
        const puzzle = generatePuzzle(config, seed === session?.puzzle.seed ? (seed + 1) >>> 0 : seed)
        save({ puzzle, play: { found: [], hinted: [] } })
      }
    },
    mount(panel) {
      if (!session) return
      let current = session
      let viewing = false
      const board = mountBoard(panel, current.puzzle, (from, to) => {
        if (viewing) return
        const result = selectWord(current, from, to)
        if (result.status === 'invalid') board.invalid(from, to)
        if (result.status === 'already-found') board.announce(`${result.word} je že med najdenimi.`)
        if (result.status !== 'found') return
        current = { ...current, play: result.play }
        save(current)
        paint()
        board.announce(`Najdena beseda: ${result.word}.`, 'success')
        if (complete(current)) ui.congratulate('Našel si vse skrite besede.')
      })
      const { hint, reveal } = gameActions(panel, () => {
        const result = nextHint(current)
        if (!result || viewing) return
        current = { ...current, play: result.play }
        save(current)
        paint()
        board.announce(`Ena od še nenajdenih besed je skrita ${result.orientation}.`, 'warning')
      }, () => {
        if (viewing) {
          viewing = false
          board.announce('')
          paint()
        } else {
          ui.ask('Pokažem rešitev?', 'Prikazane bodo vse manjkajoče besede. Nato lahko nadaljuješ od istega napredka.',
            'Pokaži rešitev', () => {
              viewing = true
              board.announce('')
              paint()
            })
        }
      })
      function paint() {
        board.paint(current.play, viewing)
        hint.disabled = viewing || !nextHint(current)
        hint.textContent = `Namig (${hintLimit - current.play.hinted.length})`
        reveal.disabled = complete(current)
        reveal.textContent = viewing ? 'Nazaj k uganki' : 'Pokaži rešitev'
      }
      paint()
      return board.dispose
    },
  }
}
