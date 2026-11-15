import './styles.css'
import { examples, type Game } from './examples'

const catalog = document.querySelector<HTMLElement>('#catalog')!
const gamesTitle = document.querySelector<HTMLElement>('#games-title')!
const gameList = document.querySelector<HTMLElement>('#game-list')!
const play = document.querySelector<HTMLElement>('#play')!
const playTitle = document.querySelector<HTMLElement>('#play-title')!
const playDescription = document.querySelector<HTMLElement>('#play-description')!
const boardPanel = document.querySelector<HTMLElement>('#board-panel')!
const theme = document.querySelector<HTMLSelectElement>('#theme')!
const difficulty = document.querySelector<HTMLSelectElement>('#difficulty')!
const appliedDifficulty = document.querySelector<HTMLElement>('#applied-difficulty')!
const congratulations = document.querySelector<HTMLDialogElement>('#congratulations')!

const icons: Record<Game, string> = {
  wordsearch: '<span>A</span><span>B</span><span>U</span><span>G</span>',
  crossword: '<span>→</span><span></span><span></span><span>↓</span>',
  sudoku: '<span>5</span><span></span><span></span><span>8</span>',
  maze: '<span></span><span></span><span></span><span>●</span>',
}

let selectedCard: HTMLButtonElement | undefined

for (const game of Object.keys(examples) as Game[]) {
  const { name, description } = examples[game]
  const card = document.createElement('button')
  card.type = 'button'
  card.className = 'game-card'
  card.dataset.game = game
  card.innerHTML = `
    <span class="game-icon" aria-hidden="true">${icons[game]}</span>
    <span class="card-name">${name}</span>
    <span class="card-description">${description}</span>
    <span class="card-arrow" aria-hidden="true">↗</span>
  `
  card.addEventListener('click', () => {
    selectedCard = card
    openExample(game)
  })
  gameList.append(card)
}

function renderBoard(game: Game) {
  if (game === 'maze') {
    const rows = examples.maze.rows.map((row) => `
      <tr>${Array.from(row, (cell) => {
        if (cell === '#') return '<td class="wall" aria-label="Zid"></td>'
        if (cell === 'S') return '<td class="maze-start" aria-label="Začetek">●</td>'
        if (cell === 'F') return '<td class="maze-finish" aria-label="Cilj">★</td>'
        return '<td aria-label="Pot"></td>'
      }).join('')}</tr>
    `).join('')
    return `<table class="board maze-board" aria-label="Vzorčni labirint"><tbody>${rows}</tbody></table>
      <p class="board-legend">● Začetek <span>★ Cilj</span></p>`
  }

  if (game === 'crossword') {
    const { clues, rows } = examples.crossword
    const clueCell = (clue: string, arrow: string, direction: string) =>
      `<td class="clue">${clue}<span aria-label="${direction}">${arrow}</span></td>`
    return `<table class="board cross-board" aria-label="Vzorčna skandinavska križanka">
      <tbody>
        <tr><td class="cross-block"></td>${clues.map((clue) => clueCell(clue, '↓', 'navzdol')).join('')}</tr>
        ${rows.map((row, index) => `<tr>${clueCell(clues[index], '→', 'desno')}${letterCells(row)}</tr>`).join('')}
      </tbody>
    </table>`
  }

  const { name, rows } = examples[game]
  const grid = rows.map((row, index) => {
    const found = game === 'wordsearch' && index === 0 ? 4 : 0
    return `<tr>${letterCells(row, found)}</tr>`
  }).join('')
  const words = game === 'wordsearch'
    ? `<ul class="word-list" aria-label="Skrite besede">${examples.wordsearch.words.map((word, index) =>
      index === 0 ? `<li class="found" aria-label="${word}, najdena">✓ <s>${word}</s></li>` : `<li>${word}</li>`,
    ).join('')}</ul>`
    : ''
  return `<table class="board ${game}-board" aria-label="Vzorčna mreža za igro ${name}"><tbody>${grid}</tbody></table>${words}`
}

function letterCells(row: string, found = 0) {
  return Array.from(row, (letter, index) => {
    if (letter === '.') return '<td aria-label="Prazno polje"></td>'
    return index < found ? `<td class="found">${letter}</td>` : `<td>${letter}</td>`
  }).join('')
}

function openExample(game: Game) {
  const { name, description } = examples[game]
  play.dataset.game = game
  playTitle.textContent = name
  playDescription.textContent = description
  boardPanel.innerHTML = renderBoard(game)
  difficulty.value = 'Lahka'
  applyDifficulty()
  catalog.hidden = true
  play.hidden = false
  window.scrollTo(0, 0)
  playTitle.focus({ preventScroll: true })
}

function showCatalog(focus: HTMLElement) {
  play.hidden = true
  catalog.hidden = false
  focus.focus({ preventScroll: true })
  focus.scrollIntoView({ block: 'nearest' })
}

function applyDifficulty() {
  appliedDifficulty.textContent = `Izbrana težavnost primera: ${difficulty.value}.`
}

theme.value = 'system'
theme.addEventListener('change', () => {
  document.documentElement.dataset.theme = theme.value
})

document.querySelector<HTMLAnchorElement>('#start')!.addEventListener('click', (event) => {
  event.preventDefault()
  gamesTitle.focus({ preventScroll: true })
  gamesTitle.scrollIntoView()
})

document.querySelector<HTMLAnchorElement>('#back')!.addEventListener('click', (event) => {
  event.preventDefault()
  showCatalog(selectedCard ?? gamesTitle)
})

const brand = document.querySelector<HTMLAnchorElement>('.brand')!
brand.addEventListener('click', (event) => {
  event.preventDefault()
  showCatalog(brand)
  window.scrollTo(0, 0)
})

document.querySelector('#new-puzzle')!.addEventListener('click', applyDifficulty)
document.querySelector('#show-congratulations')!.addEventListener('click', () => congratulations.showModal())
