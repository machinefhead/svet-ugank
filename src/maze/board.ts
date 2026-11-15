import { directions, type Direction, type MazePuzzle } from './model.ts'
import { adjacent, canMove } from './solver.ts'
import type { MazePlay } from './session.ts'

const keyboard: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right',
}

export function mountMazeBoard(
  panel: HTMLElement, puzzle: MazePuzzle, move: (cell: number) => void, restart: () => void,
) {
  panel.innerHTML = `
    <div class="maze-viewport" tabindex="0" role="group" aria-label="Mreža labirinta" aria-describedby="maze-instructions">
      <div class="maze-grid" aria-hidden="true"></div>
    </div>
    <div class="board-feedback maze-feedback">
      <p id="maze-instructions">Klikni ali se dotakni sosednjega polja, povleci po hodniku ali uporabi puščice.</p>
      <p>● Ti · S Začetek · ★ Cilj · obarvana sled prehojenih polj</p>
      <p class="maze-progress" aria-live="polite"></p>
      <p class="board-message" role="status"></p>
    </div>
    <div class="maze-controls">
      <div class="maze-directions" role="group" aria-label="Premikanje po labirintu"></div>
      <div class="maze-view-actions">
        <button type="button" class="button secondary maze-zoom" aria-pressed="false">Povečava</button>
        <button type="button" class="button secondary maze-pan" aria-pressed="false">Drsenje mreže</button>
        <button type="button" class="button secondary maze-restart">Na začetek</button>
      </div>
    </div>`
  const viewport = panel.querySelector<HTMLElement>('.maze-viewport')!
  const grid = panel.querySelector<HTMLElement>('.maze-grid')!
  const progress = panel.querySelector<HTMLElement>('.maze-progress')!
  const message = panel.querySelector<HTMLElement>('.board-message')!
  const controls = panel.querySelector<HTMLElement>('.maze-directions')!
  const zoom = panel.querySelector<HTMLButtonElement>('.maze-zoom')!
  const pan = panel.querySelector<HTMLButtonElement>('.maze-pan')!
  const instructions = panel.querySelector<HTMLElement>('#maze-instructions')!
  const cells = Array.from(puzzle.open, (open, cell) => {
    const tile = document.createElement('span')
    tile.className = open ? 'maze-tile' : 'maze-tile maze-wall'
    tile.dataset.cell = String(cell)
    if (cell === puzzle.start) {
      tile.classList.add('maze-start')
      tile.textContent = 'S'
    } else if (cell === puzzle.goal) {
      tile.classList.add('maze-goal')
      tile.textContent = '★'
    }
    return tile
  })
  grid.style.setProperty('--maze-width', String(puzzle.width))
  grid.replaceChildren(...cells)
  let position = puzzle.start
  let pointer: number | null = null
  let locked = false
  let panning = false
  let hintCell: number | null = null
  let visited = new Set<number>()
  let showingSolution = false

  function keepInView() {
    const tile = cells[position]
    const view = viewport.getBoundingClientRect()
    const box = tile.getBoundingClientRect()
    const padding = box.width * 2
    if (box.left < view.left + padding) viewport.scrollLeft += box.left - view.left - padding
    if (box.right > view.left + viewport.clientWidth - padding) {
      viewport.scrollLeft += box.right - view.left - viewport.clientWidth + padding
    }
    if (box.top < view.top + padding) viewport.scrollTop += box.top - view.top - padding
    if (box.bottom > view.top + viewport.clientHeight - padding) {
      viewport.scrollTop += box.bottom - view.top - viewport.clientHeight + padding
    }
  }

  function destination({ dx, dy }: typeof directions[Direction]) {
    return adjacent(puzzle.width, position, dx, dy)
  }

  const buttons = Object.entries(directions).map(([direction, data]) => {
    const button = document.createElement('button')
    button.className = 'button secondary'
    button.type = 'button'
    button.dataset.direction = direction
    button.textContent = data.icon
    button.setAttribute('aria-label', data.label)
    button.addEventListener('click', () => { if (!locked) move(destination(data)) })
    controls.append(button)
    return button
  })

  viewport.addEventListener('keydown', (event) => {
    if (!Object.hasOwn(keyboard, event.key) || event.altKey || event.ctrlKey || event.metaKey || panning) return
    event.preventDefault()
    if (!locked) move(destination(directions[keyboard[event.key]]))
  })

  function cellAt(event: PointerEvent) {
    const tile = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-cell]')
    return tile && grid.contains(tile) ? Number(tile.dataset.cell) : -1
  }

  grid.addEventListener('pointerdown', (event) => {
    if (panning || locked || pointer !== null || !event.isPrimary || event.button !== 0) return
    const cell = cellAt(event)
    pointer = event.pointerId
    grid.setPointerCapture(pointer)
    viewport.focus({ preventScroll: true })
    if (cell !== position) move(cell)
  })

  grid.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointer || locked) return
    const cell = cellAt(event)
    // Ignore jumps and walls. A fast drag has to return to a neighboring tile.
    if (canMove(puzzle, position, cell)) move(cell)
  })

  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
    grid.addEventListener(event, ({ pointerId }) => {
      if (pointerId === pointer) pointer = null
    })
  }

  zoom.addEventListener('click', () => {
    const enlarged = viewport.classList.toggle('enlarged')
    zoom.setAttribute('aria-pressed', String(enlarged))
    keepInView()
  })

  pan.addEventListener('click', () => {
    panning = viewport.classList.toggle('panning')
    pan.setAttribute('aria-pressed', String(panning))
    instructions.textContent = panning
      ? 'Povleci za premik pogleda. Smerni gumbi še vedno premikajo igralca.'
      : 'Klikni ali se dotakni sosednjega polja, povleci po hodniku ali uporabi puščice.'
  })
  panel.querySelector('.maze-restart')!.addEventListener('click', restart)

  function markHint(cell: number | null) {
    if (hintCell !== null) cells[hintCell].classList.remove('maze-hint')
    hintCell = cell
    if (cell !== null) cells[cell].classList.add('maze-hint')
  }

  return {
    paint(play: MazePlay) {
      cells[position].classList.remove('maze-player')
      position = play.position
      cells[position].classList.add('maze-player')
      if (play.visited.length < visited.size) {
        for (const cell of visited) cells[cell].classList.remove('maze-visited')
        visited = new Set()
      }
      for (let i = visited.size; i < play.visited.length; i++) {
        const cell = play.visited[i]
        visited.add(cell)
        cells[cell].classList.add('maze-visited')
      }
      const complete = play.finishedAt !== null
      locked = complete || showingSolution
      // Keep keyboard focus on the direction used for the final move.
      for (const button of buttons) button.setAttribute('aria-disabled', String(locked))
      const exits = Object.values(directions).filter((data) => canMove(puzzle, position, destination(data)))
      const status = complete ? '✓ Cilj dosežen.' : `Odprte smeri: ${exits.map(({ label }) => label.toLowerCase()).join(', ')}.`
      progress.textContent = `Koraki: ${play.steps} · Namigi: ${play.hints}. ${status}`
      progress.classList.toggle('maze-complete', complete)
      keepInView()
    },
    announce(text: string, tone?: 'error' | 'warning' | 'success') {
      message.textContent = text
      message.dataset.tone = tone ?? ''
    },
    markHint,
    showSolution(show: boolean) {
      if (showingSolution === show) return
      showingSolution = show
      for (const cell of puzzle.solution) cells[cell].classList.toggle('maze-solution', show)
    },
    focus() { viewport.focus({ preventScroll: true }) },
  }
}
