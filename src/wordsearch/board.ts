import { lineBetween } from './checker.ts'
import { bindGrid } from './input.ts'
import type { Puzzle } from './model.ts'
import type { PlayState } from './session.ts'

export function mountBoard(panel: HTMLElement, puzzle: Puzzle, select: (from: number, to: number) => void) {
  panel.innerHTML = `
    <div class="letter-grid" role="grid" aria-label="Mreža osmosmerke" aria-describedby="word-instructions"></div>
    <p class="board-instructions" id="word-instructions">Dotakni se prve in zadnje črke. Z miško lahko tudi povlečeš, s tipkovnico pa uporabiš puščice in Enter.</p>
    <div class="board-feedback">
      <p class="board-progress" role="status"></p>
      <p class="board-message" role="status"></p>
    </div>
    <h2 class="word-list-title" id="word-list-title">Iskane in najdene besede</h2>
    <ul class="word-list" aria-labelledby="word-list-title"></ul>`
  const grid = panel.querySelector<HTMLElement>('.letter-grid')!
  const { size } = puzzle.config
  grid.style.setProperty('--size', String(size))
  const buttons: HTMLButtonElement[] = []
  for (let y = 0; y < size; y++) {
    const row = document.createElement('div')
    row.setAttribute('role', 'row')
    for (let x = 0; x < size; x++) {
      const i = y * size + x
      const cell = document.createElement('div')
      cell.setAttribute('role', 'gridcell')
      const button = document.createElement('button')
      button.type = 'button'
      button.tabIndex = i === 0 ? 0 : -1
      button.dataset.cell = String(i)
      button.textContent = puzzle.letters[i]
      cell.append(button)
      row.append(cell)
      buttons.push(button)
    }
    grid.append(row)
  }

  const list = panel.querySelector<HTMLUListElement>('.word-list')!
  const progress = panel.querySelector<HTMLElement>('.board-progress')!
  const message = panel.querySelector<HTMLElement>('.board-message')!
  const items = puzzle.placements.map(() => list.appendChild(document.createElement('li')))
  let active: number[] = []
  let invalid: number[] = []

  function announce(text: string, tone = '') {
    invalid.forEach((i) => buttons[i].classList.remove('invalid'))
    invalid = []
    message.textContent = text
    message.dataset.tone = tone
  }

  const input = bindGrid(grid, buttons, size, select, (cells) => {
    active.forEach((i) => buttons[i].classList.remove('selected'))
    active = cells
    active.forEach((i) => buttons[i].classList.add('selected'))
  }, announce)

  return {
    announce,
    dispose: input.dispose,
    invalid(from: number, to: number) {
      announce('Ta izbira ni iskana beseda. Poskusi znova.', 'error')
      const line = lineBetween(size, from, to)
      invalid = line.length ? line : [from, to]
      invalid.forEach((i) => buttons[i].classList.add('invalid'))
    },
    paint(play: PlayState, viewing: boolean) {
      const locked = viewing || play.found.length === puzzle.placements.length
      input.lock(locked)
      const found = new Set<number>()
      const solution = new Set<number>()
      puzzle.placements.forEach(({ word, cells }, i) => {
        const done = play.found.includes(word)
        items[i].textContent = done ? `✓ ${word}` : word
        items[i].classList.toggle('found', done)
        items[i].classList.toggle('solution', viewing && !done)
        if (done) cells.forEach((cell) => found.add(cell))
        else if (viewing) cells.forEach((cell) => solution.add(cell))
      })
      buttons.forEach((button, i) => {
        button.classList.toggle('found', found.has(i))
        button.classList.toggle('solution', solution.has(i))
        button.setAttribute('aria-disabled', String(locked))
        const labels = [puzzle.letters[i]]
        if (found.has(i)) labels.push('najdena')
        if (solution.has(i)) labels.push('manjkajoča rešitev')
        button.setAttribute('aria-label', labels.join(', '))
      })
      progress.textContent = viewing ? 'Zeleno so označene najdene besede, vijolično pa manjkajoče.'
        : `Najdene besede: ${play.found.length} / ${puzzle.placements.length}.`
    },
  }
}
