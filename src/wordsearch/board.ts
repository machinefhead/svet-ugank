import { isComplete, lineBetween } from './checker.ts'
import { type PlayState, type Puzzle } from './model.ts'

export function mountBoard(panel: HTMLElement, puzzle: Puzzle, onLine: (from: number, to: number) => void) {
  panel.innerHTML = `
    <div class="letter-grid" role="grid" aria-label="Mreža osmosmerke" aria-describedby="board-instructions"></div>
    <p class="board-instructions" id="board-instructions">Na telefonu se pomikaj po strani z navpičnim potegom. Besedo označi z dotikom prve in zadnje črke. Z miško lahko tudi povlečeš, s tipkovnico pa uporabiš puščice in Enter.</p>
    <section class="word-list-section" aria-labelledby="word-list-title">
      <h2 id="word-list-title">Iskane in najdene besede</h2>
      <p class="board-progress" role="status"></p>
      <ul class="word-list" aria-label="Iskane in najdene besede"></ul>
    </section>
    <div class="board-feedback">
      <p class="board-message" role="status"></p>
      <button type="button" class="button secondary exit-solution" hidden>Nazaj k uganki</button>
    </div>`
  const grid = panel.querySelector<HTMLElement>('.letter-grid')!
  const instructions = panel.querySelector<HTMLElement>('.board-instructions')!
  grid.style.setProperty('--size', String(puzzle.size))
  const buttons: HTMLButtonElement[] = []
  for (let row = 0; row < puzzle.size; row++) {
    const gridRow = document.createElement('div')
    gridRow.setAttribute('role', 'row')
    for (let col = 0; col < puzzle.size; col++) {
      const index = row * puzzle.size + col
      const cell = document.createElement('div')
      cell.setAttribute('role', 'gridcell')
      const button = document.createElement('button')
      button.type = 'button'
      button.tabIndex = index === 0 ? 0 : -1
      button.textContent = puzzle.letters[index]
      button.dataset.cell = String(index)
      cell.append(button)
      gridRow.append(cell)
      buttons.push(button)
    }
    grid.append(gridRow)
  }

  const items = puzzle.placements.map(({ word, cells }) => {
    const item = document.createElement('li')
    item.tabIndex = -1
    const label = document.createElement('span')
    label.textContent = word
    const solution = document.createElement('button')
    solution.type = 'button'
    solution.textContent = word
    solution.hidden = true
    solution.setAttribute('aria-pressed', 'false')
    solution.addEventListener('click', () => {
      solutionWord = solutionWord === word ? null : word
      paint(currentPlay)
      const coordinates = (cell: number) => `vrstica ${Math.floor(cell / puzzle.size) + 1}, stolpec ${cell % puzzle.size + 1}`
      announce(solutionWord ? `${word}: ${coordinates(cells[0])} → ${coordinates(cells.at(-1)!)}.` : '')
    })
    item.append(label, solution)
    panel.querySelector('.word-list')!.append(item)
    return { item, label, solution }
  })
  const progress = panel.querySelector<HTMLElement>('.board-progress')!
  const message = panel.querySelector<HTMLElement>('.board-message')!
  const exit = panel.querySelector<HTMLButtonElement>('.exit-solution')!
  let anchor: number | null = null
  let activeCell = 0
  let gesture: { id: number; cell: number } | null = null
  let preview: number[] = []
  let invalid: number[] = []
  let locked = false
  let viewing = false
  let solutionWord: string | null = null
  let currentPlay: PlayState

  function paintSelection(next: number[]) {
    for (const cell of preview) buttons[cell].classList.remove('selected')
    preview = next
    for (const cell of preview) buttons[cell].classList.add('selected')
  }

  function clearSelection() {
    anchor = null
    paintSelection([])
  }

  function announce(text: string, tone: 'neutral' | 'success' | 'error' | 'warning' = 'neutral') {
    for (const cell of invalid) buttons[cell].classList.remove('invalid')
    invalid = []
    message.textContent = text
    message.dataset.tone = tone
  }

  function focusCell(index: number) {
    buttons[activeCell].tabIndex = -1
    activeCell = index
    buttons[index].tabIndex = 0
    buttons[index].focus({ preventScroll: true })
  }

  function activate(index: number) {
    if (locked) return
    if (anchor === null) {
      anchor = index
      paintSelection([index])
      announce('Izberi še drugo končno črko.')
    } else {
      const from = anchor
      clearSelection()
      if (from !== index) onLine(from, index)
      else announce('Izbira preklicana.')
    }
  }

  function cellAt(target: EventTarget | null) {
    const button = target instanceof Element ? target.closest<HTMLButtonElement>('[data-cell]') : null
    return button && grid.contains(button) ? Number(button.dataset.cell) : null
  }

  grid.addEventListener('pointerdown', (event) => {
    const cell = cellAt(event.target)
    if (locked || cell === null || !event.isPrimary || event.button !== 0 || gesture) return
    if (invalid.length) announce('')
    gesture = { id: event.pointerId, cell }
    if (event.pointerType !== 'touch') {
      grid.setPointerCapture(event.pointerId)
      event.preventDefault()
    }
    // Touch keeps native vertical scrolling. A tap selects an endpoint;
    // a browser-owned scroll triggers pointercancel and cancels the gesture.
    focusCell(cell)
  })
  grid.addEventListener('pointermove', (event) => {
    if (gesture?.id !== event.pointerId) return
    const end = cellAt(document.elementFromPoint(event.clientX, event.clientY))
    const from = anchor ?? gesture.cell
    paintSelection(end === null ? [from] : lineBetween(puzzle.size, from, end))
  })
  grid.addEventListener('pointerup', (event) => {
    if (gesture?.id !== event.pointerId) return
    const start = gesture.cell
    const end = cellAt(document.elementFromPoint(event.clientX, event.clientY))
    gesture = null
    if (end === null) {
      paintSelection(anchor === null ? [] : [anchor])
    } else if (end !== start) {
      clearSelection()
      focusCell(end)
      onLine(start, end)
    } else {
      activate(end)
    }
  })
  const cancelGesture = (event: PointerEvent) => {
    if (gesture?.id !== event.pointerId) return
    gesture = null
    paintSelection(anchor === null ? [] : [anchor])
  }
  grid.addEventListener('pointercancel', cancelGesture)
  grid.addEventListener('lostpointercapture', cancelGesture)
  grid.addEventListener('click', (event) => {
    // Keyboard and assistive activations have no pointer gesture.
    const cell = cellAt(event.target)
    if (event.detail === 0 && cell !== null) activate(cell)
  })
  grid.addEventListener('keydown', (event) => {
    const index = cellAt(event.target)
    if (index === null) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!event.repeat) activate(index)
      return
    }
    const row = Math.floor(index / puzzle.size)
    const col = index % puzzle.size
    if (event.key === 'Escape' && anchor !== null) {
      event.preventDefault()
      clearSelection()
      announce('Izbira preklicana.')
      return
    }
    let next = index
    if (event.key === 'ArrowUp' && row > 0) next -= puzzle.size
    else if (event.key === 'ArrowDown' && row + 1 < puzzle.size) next += puzzle.size
    else if (event.key === 'ArrowLeft' && col > 0) next--
    else if (event.key === 'ArrowRight' && col + 1 < puzzle.size) next++
    if (!event.key.startsWith('Arrow')) return
    event.preventDefault()
    focusCell(next)
    if (anchor !== null) paintSelection(lineBetween(puzzle.size, anchor, next))
  })

  function paint(play: PlayState) {
    currentPlay = play
    locked = play.revealed || isComplete(puzzle, play.found)
    if (locked) clearSelection()
    const foundCells = new Set<number>()
    const solutionCells = new Set<number>()
    for (const [i, { word, cells }] of puzzle.placements.entries()) {
      const found = play.found.includes(word)
      const { item, label, solution } = items[i]
      item.classList.toggle('found', found && !viewing)
      item.classList.toggle('solution-word', viewing)
      label.hidden = viewing
      const step = cells[1] - cells[0]
      const orientation = Math.abs(step) === 1 ? 'vodoravno' :
        Math.abs(step) === puzzle.size ? 'navpično' : 'diagonalno'
      label.textContent = found ? `✓ ${word}` :
        play.hints.includes(word) ? `${word} · namig: ${orientation}` : word
      solution.hidden = !viewing
      solution.setAttribute('aria-pressed', String(solutionWord === word))
      if (found) cells.forEach((cell) => foundCells.add(cell))
      if (viewing && (!solutionWord || solutionWord === word)) cells.forEach((cell) => solutionCells.add(cell))
      item.classList.toggle('hint-word', !found && play.hints.includes(word))
    }
    for (const [i, button] of buttons.entries()) {
      button.classList.toggle('found', !viewing && foundCells.has(i))
      button.classList.toggle('solution', solutionCells.has(i))
       button.setAttribute('aria-disabled', String(locked))
      const flags = [foundCells.has(i) && 'najdena', solutionCells.has(i) && 'rešitev'].filter(Boolean)
      button.setAttribute('aria-label', [puzzle.letters[i], ...flags].join(', '))
    }
    grid.classList.toggle('locked', locked)
    instructions.hidden = locked
    exit.hidden = !viewing
    progress.textContent = viewing ? 'Rešitev · izberi besedo za prikaz njene poti.' :
      `Najdene besede: ${play.found.length} / ${puzzle.placements.length}.` +
      (play.revealed ? ' Rešitev je bila prikazana. Ta uganka se ne šteje med rezultate.' : '')
  }

  exit.addEventListener('click', () => {
    viewing = false
    solutionWord = null
    paint(currentPlay)
    announce('')
    focusCell(activeCell)
  })

  return {
    paint, announce,
    showInvalid: (from: number, to: number) => {
      announce('Ta izbira ni iskana beseda. Poskusi znova.', 'error')
      const line = lineBetween(puzzle.size, from, to)
      invalid = line.length ? line : [from, to]
      for (const cell of invalid) buttons[cell].classList.add('invalid')
    },
    focus: () => {
      focusCell(activeCell)
      buttons[activeCell].scrollIntoView({ block: 'nearest' })
    },
    focusHint: (word: string) => {
      const entry = items.find(({ label }) => label.textContent?.startsWith(word))
      if (!entry) return
      entry.item.focus({ preventScroll: true })
      entry.item.scrollIntoView({ block: 'nearest' })
    },
    viewSolution: () => {
      viewing = true
      paint(currentPlay)
      announce('')
      exit.focus()
    },
  }
}
