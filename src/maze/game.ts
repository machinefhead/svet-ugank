import { gameActions, selectField, type GameController, type GameUI } from '../game-ui.ts'
import { newSeed } from '../random.ts'
import { openSlot, readLegacy, savedGameNotice } from '../storage.ts'
import { directionNames, mountMazeBoard } from './board.ts'
import { generateMaze } from './generator.ts'
import { defaultConfig, isConfig, levels, sizes, type Direction, type MazeConfig } from './model.ts'
import { complete, decodeSession, encodeSession, hintMaze, moveMaze, startMaze, type Session } from './session.ts'
import { step } from './solver.ts'

const briefs = {
  easy: 'Krajša pot z manj zahtevnimi odločitvami.',
  medium: 'Daljša pot z več zavoji in odcepi.',
  hard: 'Daljša zavita pot in zahtevnejše odločitve na razpotjih.',
}

export function setupMaze(getStorage: () => Storage, ui: GameUI): GameController {
  const slot = openSlot(getStorage, 'maze', decodeSession, encodeSession)
  let session = slot.value
  const hasLegacy = !session && Boolean(readLegacy(getStorage, 'svet-ugank:maze', 'active'))
  let draft = session?.puzzle.config ?? defaultConfig

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
      const size = selectField(fields, 'maze-size', 'Velikost mreže', sizes.map((n) => [n, `${n} × ${n}`]), draft.size)
      const level = selectField(fields, 'maze-level', 'Težavnost', Object.entries(levels), draft.level)
      const summary = document.createElement('p')
      fields.append(summary)
      function read(): MazeConfig {
        const config = { size: Number(size.value), level: level.value }
        if (!isConfig(config)) throw new RangeError('Preveri nastavitve labirinta.')
        return config
      }
      function preview() {
        draft = read()
        summary.textContent = `${draft.size} × ${draft.size} polj. ${briefs[draft.level]}`
      }
      size.addEventListener('change', preview)
      level.addEventListener('change', preview)
      preview()
      return () => {
        const seed = newSeed()
        save(startMaze(generateMaze(read(), seed === session?.puzzle.seed ? (seed + 1) >>> 0 : seed)))
      }
    },
    mount(panel) {
      if (!session) return
      let current = session
      let viewing = false
      function move(cell: number) {
        if (viewing) return false
        const next = moveMaze(current, cell)
        if (next === current) return false
        current = next
        save(current)
        board.announce('')
        paint()
        if (complete(current)) ui.congratulate('Dosegel si cilj labirinta.')
        return true
      }
      const board = mountMazeBoard(panel, current.puzzle, (direction: Direction) => {
        return move(step(current.puzzle, current.play.position, direction))
      }, (cell) => {
        if (!move(cell)) board.announce('Izberi sosednje odprto polje.', 'error')
      })
      const { hint, reveal } = gameActions(panel, () => {
        board.stop()
        const direction = hintMaze(current)
        if (direction && !viewing) board.announce(`Premakni se en korak ${directionNames[direction]}.`, 'warning')
      }, () => {
        board.stop()
        if (viewing) {
          viewing = false
          paint()
          return
        }
        ui.ask('Pokažem rešitev?', 'Prikazana bo celotna pot od začetka do cilja. Nato lahko nadaljuješ s svojega položaja.',
          'Pokaži rešitev', () => {
            viewing = true
            board.announce('')
            paint()
          })
      })
      function paint() {
        board.paint(current.play, viewing)
        hint.disabled = viewing || complete(current)
        reveal.disabled = complete(current)
        reveal.textContent = viewing ? 'Nazaj k uganki' : 'Pokaži rešitev'
      }
      paint()
      return board.dispose
    },
  }
}
