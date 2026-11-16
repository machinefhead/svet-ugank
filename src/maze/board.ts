import { directions, type Direction, type MazePuzzle } from './model.ts'
import { adjacent, canMove } from './solver.ts'
import { cellsAlongSegment, legalDragSteps, type PointerPoint } from './pointer.ts'
import type { MazePlay } from './session.ts'

const keyboard: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right',
}

export function mountMazeBoard(
  panel: HTMLElement, puzzle: MazePuzzle, move: (cell: number) => void, restart: () => void,
) {
  panel.innerHTML = `
    <p class="maze-solution-banner" role="status" hidden>Rumeno označena pot vodi od začetka (S) do cilja (★). Rešitev je prikazana v celotni mreži; ta uganka ne šteje med rezultate.</p>
    <div class="maze-viewport" tabindex="0" role="group" aria-label="Celoten labirint" aria-describedby="maze-instructions">
      <div class="maze-grid" aria-hidden="true"></div>
    </div>
    <div class="board-feedback maze-feedback">
      <p id="maze-instructions">Celotna mreža je vidna. Na telefonu povleci v želeno smer kjerkoli po mreži ali uporabi smerne gumbe. Povečava omogoči natančen ogled.</p>
      <p>● Ti · S Začetek · ★ Cilj · sled prehojene poti · <strong>rumena pot = ogled rešitve</strong></p>
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
  const solutionBanner = panel.querySelector<HTMLElement>('.maze-solution-banner')!
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
  let lastPointer: PointerPoint | null = null
  let touchControl: { x: number; y: number } | null = null
  let locked = false
  let panning = false
  let hintCell: number | null = null
  let visited = new Set<number>()
  let showingSolution = false

  function keepInView() {
    if (!viewport.classList.contains('enlarged')) return
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

  function followPointer(event: PointerEvent) {
    if (locked) return
    if (touchControl !== null && !viewport.classList.contains('enlarged')) {
      // A finger-sized swipe works even when a 121×121 overview has tiny cells.
      const threshold = 16
      let dx = event.clientX - touchControl.x
      let dy = event.clientY - touchControl.y
      for (let count = 0; count < 24 && Math.max(Math.abs(dx), Math.abs(dy)) >= threshold; count++) {
        const horizontal = Math.abs(dx) >= Math.abs(dy)
        const direction = horizontal ? (dx > 0 ? directions.right : directions.left) :
          (dy > 0 ? directions.down : directions.up)
        const next = destination(direction)
        if (canMove(puzzle, position, next)) move(next)
        if (horizontal) touchControl.x += Math.sign(dx) * threshold
        else touchControl.y += Math.sign(dy) * threshold
        dx = event.clientX - touchControl.x
        dy = event.clientY - touchControl.y
      }
      event.preventDefault()
      return
    }
    if (lastPointer === null) return
    const rect = grid.getBoundingClientRect()
    const at: PointerPoint = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const candidates = cellsAlongSegment(puzzle.width, rect.width / puzzle.width, lastPointer, at)
    // Interpolate only along the drawn pointer segment. Each move still passes
    // the existing wall/adjacency rules and stops at the first invalid cell.
    for (const next of legalDragSteps(puzzle, position, candidates)) {
      if (locked) break
      move(next)
    }
    // keepInView can scroll the viewport while moving; store the pointer
    // relative to the grid *after* any automatic scrolling.
    const updatedRect = grid.getBoundingClientRect()
    lastPointer = { x: event.clientX - updatedRect.left, y: event.clientY - updatedRect.top }
  }

  grid.addEventListener('pointerdown', (event) => {
    if (panning || locked || pointer !== null || !event.isPrimary || event.button !== 0) return
    const cell = cellAt(event)
    // Starting a drag on a distant wall/tile must not move the player.
    if (cell < 0) return
    const steerByTouch = event.pointerType === 'touch' && !viewport.classList.contains('enlarged')
    if (!steerByTouch && cell !== position && !canMove(puzzle, position, cell)) return
    pointer = event.pointerId
    touchControl = steerByTouch ? { x: event.clientX, y: event.clientY } : null
    grid.setPointerCapture(pointer)
    viewport.focus({ preventScroll: true })
    if (!steerByTouch && cell !== position) move(cell)
    const rect = grid.getBoundingClientRect()
    lastPointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    event.preventDefault()
  })
  grid.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointer) followPointer(event)
  })
  grid.addEventListener('pointerup', (event) => {
    if (event.pointerId !== pointer) return
    followPointer(event) // Some quick swipes deliver their final point only on pointerup.
    pointer = null
    lastPointer = null
    touchControl = null
  })
  for (const type of ['pointercancel', 'lostpointercapture'] as const) {
    grid.addEventListener(type, (event) => {
      if (event.pointerId !== pointer) return
      pointer = null
      lastPointer = null
      touchControl = null
    })
  }

  function setZoom(enlarged: boolean) {
    viewport.classList.toggle('enlarged', enlarged)
    zoom.setAttribute('aria-pressed', String(enlarged))
    if (!enlarged) {
      panning = false
      viewport.classList.remove('panning')
      pan.setAttribute('aria-pressed', 'false')
    }
    keepInView()
  }
  zoom.addEventListener('click', () => setZoom(!viewport.classList.contains('enlarged')))

  pan.addEventListener('click', () => {
    if (!viewport.classList.contains('enlarged')) setZoom(true)
    panning = viewport.classList.toggle('panning')
    pan.setAttribute('aria-pressed', String(panning))
    instructions.textContent = panning
      ? 'Povleci za premik pogleda. Smerni gumbi še vedno premikajo igralca.'
      : 'Na telefonu lahko premikaš igralca s potegi v želeno smer. Za celoten pregled izklopi povečavo.'
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
      if (show) setZoom(false) // Whole solution must fit on screen, not just the current crop.
      showingSolution = show
      solutionBanner.hidden = !show
      for (const cell of puzzle.solution) cells[cell].classList.toggle('maze-solution', show)
    },
    focus() { viewport.focus({ preventScroll: true }) },
  }
}
