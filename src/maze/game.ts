import { formatTime } from '../profile.ts'
import { mountMazeBoard } from './board.ts'
import { generateMaze } from './generator.ts'
import { isConfig, levels, mazeId, sizes } from './model.ts'
import { hintMaze, moveMaze, recordMazeResult, restartMaze, startMaze } from './session.ts'
import { openMazeData } from './storage.ts'

interface MazeUI {
  panel: HTMLElement
  size: HTMLSelectElement
  level: HTMLSelectElement
  applied: HTMLElement
  hint: HTMLButtonElement
  reveal: HTMLButtonElement
  ask: (title: string, text: string, action: string, run: () => void) => void
  congratulate: (message: string) => void
  storageChanged: () => void
}

export function setupMaze(ui: MazeUI) {
  const local = openMazeData(() => window.localStorage)
  const { data } = local
  let puzzle = local.puzzle
  let board: ReturnType<typeof mountMazeBoard> | null = null
  let showingSolution = false

  function save() {
    const saved = local.save()
    ui.storageChanged()
    return saved
  }

  for (const size of sizes) ui.size.add(new Option(`${2 * size + 1} × ${2 * size + 1}`, String(size)))
  for (const [id, label] of Object.entries(levels)) ui.level.add(new Option(label, id))
  ui.size.value = String(data.next.size)
  ui.level.value = data.next.level
  function pickConfig() {
    const config = { size: Number(ui.size.value), level: ui.level.value }
    if (!isConfig(config)) return
    data.next = config
    save()
  }
  ui.size.addEventListener('change', pickConfig)
  ui.level.addEventListener('change', pickConfig)

  function paint() {
    if (!board || !data.active) return
    const { play } = data.active
    board.showSolution(showingSolution)
    board.paint(play)
    ui.hint.disabled = showingSolution || play.finishedAt !== null
    ui.hint.textContent = 'Namig'
    ui.reveal.disabled = play.finishedAt !== null
    ui.reveal.textContent = showingSolution ? 'Skrij rešitev' : play.revealed ? 'Znova pokaži rešitev' : 'Pokaži rešitev'
  }

  function move(cell: number) {
    if (!puzzle || !board || !data.active || showingSolution) return
    const next = moveMaze(puzzle, data.active.play, cell, Date.now())
    if (next === data.active.play) {
      board.announce('Tja se ne moreš premakniti. Izberi odprto sosednje polje.', 'error')
      return
    }
    data.active.play = next
    board.markHint(null)
    board.announce('')
    const previous = data.results
    data.results = recordMazeResult(previous, puzzle, next)
    const saved = save()
    paint()
    if (next.finishedAt === null) return
    const elapsed = formatTime(next.finishedAt - next.startedAt)
    const detail = next.revealed ? ' Po ogledu rešitve zaključek ne šteje med rezultate.'
      : previous === data.results ? ' Ta labirint je že med tvojimi rezultati.'
      : saved ? ' Rezultat je shranjen na tej napravi.' : ' Rezultat je viden v tem zavihku.'
    ui.congratulate(`Dosegel si cilj v ${next.steps} korakih. Čas: ${elapsed}.${detail}`)
  }

  function restart() {
    if (!puzzle || !board || !data.active) return
    const reset = () => {
      if (!puzzle || !board || !data.active) return
      data.active.play = restartMaze(puzzle, data.active.play, Date.now())
      showingSolution = false
      board.markHint(null)
      save()
      paint()
      board.announce(data.active.play.revealed ? 'Vrnil si se na začetek. Ogled rešitve še vedno velja.' : 'Vrnil si se na začetek.')
      board.focus()
    }
    if (data.active.play.steps > 0 && data.active.play.finishedAt === null) {
      ui.ask('Nazaj na začetek?', 'Trenutna mreža ostane. Tvoji koraki in prehojena sled se izbrišejo.',
        'Na začetek', reset)
    } else reset()
  }

  function mount() {
    if (!puzzle || !data.active) return
    showingSolution = false
    const { config, width } = puzzle
    ui.applied.textContent = `Trenutno: ${levels[config.level]} · ${width} × ${width}`
    board = mountMazeBoard(ui.panel, puzzle, move, restart)
    paint()
    if (data.active.play.revealed && data.active.play.finishedAt === null) {
      board.announce('Rešitev je bila ogledana. Zaključek ne šteje med rezultate.', 'warning')
    }
  }

  function create(focus: boolean) {
    const config = data.next
    const used = new Set([puzzle?.puzzleId, ...data.results.map(({ puzzleId }) => puzzleId)])
    let seed = crypto.getRandomValues(new Uint32Array(1))[0]
    while (used.has(mazeId(config, seed))) seed = (seed + 1) >>> 0
    const definition = generateMaze(config, seed)
    const { revision } = definition
    puzzle = definition
    data.active = { config: definition.config, seed, revision, play: startMaze(definition, Date.now()) }
    save()
    mount()
    if (focus) board?.focus()
  }

  return {
    get available() { return local.available },
    open() {
      if (puzzle && data.active) mount()
      else create(false)
    },
    newPuzzle() {
      if (data.active && data.active.play.steps + data.active.play.hints > 0 && data.active.play.finishedAt === null) {
        ui.ask('Začneš novo uganko?', 'Z novo uganko izgubiš napredek v trenutnem labirintu.',
          'Zamenjaj uganko', () => create(true))
      } else create(true)
    },
    hint() {
      if (!puzzle || !board || !data.active || showingSolution) return
      const result = hintMaze(puzzle, data.active.play)
      if (!result) return
      const difference = result.next - data.active.play.position
      const direction = difference === 1 ? 'desno' : difference === -1 ? 'levo' : difference > 0 ? 'dol' : 'gor'
      data.active.play = result.play
      save()
      paint()
      board.markHint(result.next)
      board.announce(`Namig: premakni se korak ${direction}.`, 'warning')
    },
    reveal() {
      if (!board || !data.active) return
      if (showingSolution) {
        showingSolution = false
        paint()
        board.announce('Rešitev je skrita. Zaključek ne šteje med rezultate.', 'warning')
        return
      }
      ui.ask('Pokažem rešitev?', 'Tvoj položaj in koraki ostanejo. Po ogledu zaključek ne bo štel med rezultate.',
        'Pokaži rešitev', () => {
          if (!board || !data.active) return
          data.active.play = { ...data.active.play, revealed: true }
          showingSolution = true
          board.markHint(null)
          save()
          paint()
          board.announce('Celotna pot od začetka do cilja je označena.', 'warning')
        })
    },
    renderResults(target: HTMLElement) {
      const summary = document.createElement('p')
      const assisted = data.results.filter(({ hints }) => hints > 0).length
      summary.textContent = `Rešeni labirinti: ${data.results.length} · brez namigov: ${data.results.length - assisted} · z namigi: ${assisted}`
      target.replaceChildren(summary)
      if (!data.results.length) return
      const details = document.createElement('details')
      const title = document.createElement('summary')
      const list = document.createElement('ul')
      title.textContent = 'Zadnja dokončanja · Labirint'
      list.className = 'recent-results'
      for (const item of [...data.results].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 5)) {
        const row = document.createElement('li')
        const width = 2 * item.config.size + 1
        const assistance = item.hints ? `z namigi (${item.hints})` : 'brez namigov'
        row.textContent = `${levels[item.config.level]} · ${width} × ${width} · ${item.steps} korakov · ${formatTime(item.elapsedMs)} · ${assistance}`
        list.append(row)
      }
      details.append(title, list)
      target.append(details)
    },
  }
}
