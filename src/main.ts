import './styles.css'
import { examples, renderDemo, type Game } from './examples.ts'
import { setupMaze } from './maze/game.ts'
import type { GameController, GameUI } from './game-ui.ts'
import { setupWordsearch } from './wordsearch/game.ts'
import { isTheme, openSlot, readLegacy } from './storage.ts'

const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

const home = element('domov')
const games = element('igre')
const play = element('play')
const title = element('play-title')
const setup = element('game-setup')
const form = element<HTMLFormElement>('game-form')
const fields = element('game-fields')
const start = element<HTMLButtonElement>('start-game')
const resume = element<HTMLButtonElement>('resume-game')
const board = element('board-panel')
const newPuzzle = element<HTMLButtonElement>('new-puzzle')
const theme = element<HTMLSelectElement>('theme')
const congratulations = element<HTMLDialogElement>('congratulations')
const confirmation = element<HTMLDialogElement>('confirm')

const getStorage = () => window.localStorage
const storedTheme = openSlot(getStorage, 'theme', (value) => isTheme(value) ? value : null)
const legacyTheme = storedTheme.value === null ? readLegacy(getStorage, 'svet-ugank:r2', 'theme') : null
theme.value = storedTheme.value ?? (isTheme(legacyTheme) ? legacyTheme : 'system')
document.documentElement.dataset.theme = theme.value
if (isTheme(legacyTheme) && !storedTheme.invalid) storedTheme.save(legacyTheme)
theme.addEventListener('change', () => {
  if (!isTheme(theme.value)) return
  document.documentElement.dataset.theme = theme.value
  storedTheme.save(theme.value)
  ui.storageChanged()
})

let accept: (() => void) | null = null
const ui: GameUI = {
  storageChanged() {
    element('storage-notice').hidden = storedTheme.available && Object.values(controllers).every((game) => game.available)
  },
  congratulate(message) {
    element('congratulations-text').textContent = message
    congratulations.showModal()
  },
  ask(heading, message, action, run) {
    element('confirm-title').textContent = heading
    element('confirm-text').textContent = message
    element('confirm-action').textContent = action
    confirmation.returnValue = ''
    accept = run
    confirmation.showModal()
  },
}
confirmation.addEventListener('close', () => {
  const run = accept
  accept = null
  if (confirmation.returnValue === 'accept') run?.()
})

const controllers = {
  wordsearch: setupWordsearch(getStorage, ui), maze: setupMaze(getStorage, ui),
}
const routes: Record<Game, string> = {
  wordsearch: 'osmosmerka', crossword: 'krizanka', sudoku: 'sudoku', maze: 'labirint',
}
const icons: Record<Game, string> = {
  wordsearch: '<span>A</span><span>B</span><span>U</span><span>G</span>',
  crossword: '<span>→</span><span></span><span></span><span>↓</span>',
  sudoku: '<span>5</span><span></span><span></span><span>8</span>',
  maze: '<span></span><span></span><span></span><span>●</span>',
}
const gameIds = Object.keys(routes) as Game[]
const catalog = element('game-list')
for (const game of gameIds) {
  const demo = game === 'sudoku' || game === 'crossword'
  const card = document.createElement('a')
  card.className = 'game-card'
  card.dataset.game = game
  card.href = '#' + routes[game]
  card.innerHTML = `<span class="game-icon" aria-hidden="true">${icons[game]}</span>
    <span class="card-name">${examples[game].name}</span>
    <span class="card-description">${demo ? 'DEMO · V pripravi' : examples[game].description}</span>
    <span class="card-arrow" aria-hidden="true">↗</span>`
  catalog.append(card)
}
for (const name of ['Križec-krožec', 'Štiri v vrsto', 'Zračni hokej']) {
  const card = document.createElement('li')
  card.className = 'coming-card'
  card.textContent = name
  element('coming-list').append(card)
}

let controller: GameController | undefined
let create: (() => void) | undefined
let unmount: (() => void) | void

function clearBoard() {
  unmount?.()
  unmount = undefined
  board.hidden = true
  board.replaceChildren()
  newPuzzle.hidden = true
}

function focusHeading(heading: HTMLElement) {
  window.scrollTo(0, 0)
  heading.focus({ preventScroll: true })
}

function showSetup(focus: boolean) {
  clearBoard()
  setup.hidden = false
  form.hidden = !controller
  fields.replaceChildren()
  create = controller?.settings(fields)
  resume.hidden = !controller?.resumable
  start.textContent = controller?.resumable ? 'Začni novo' : 'Začni igro'
  element('session-notice').textContent = controller?.notice ?? ''
  element('setup-error').textContent = ''
  if (focus) focusHeading(title)
}

function showGame() {
  if (!controller) return
  setup.hidden = true
  newPuzzle.hidden = false
  board.hidden = false
  unmount = controller.mount(board)
  focusHeading(title)
}

newPuzzle.addEventListener('click', () => showSetup(true))
resume.addEventListener('click', showGame)
form.addEventListener('submit', (event) => {
  event.preventDefault()
  if (!controller || !create) return
  const game = controller
  const startGame = create
  function run() {
    if (controller !== game || setup.hidden) return
    try {
      startGame()
      showGame()
    } catch (error) {
      element('setup-error').textContent = error instanceof RangeError ? error.message
        : 'Uganke ni bilo mogoče pripraviti. Poskusi znova.'
    }
  }
  if (game.resumable) {
    ui.ask('Začneš novo uganko?', 'Nova uganka bo nadomestila tvoj trenutni napredek.', 'Začni novo', run)
  } else run()
})
fields.addEventListener('input', () => { element('setup-error').textContent = '' })

function renderRoute(focus: boolean) {
  accept = null
  if (confirmation.open) confirmation.close()
  if (congratulations.open) congratulations.close()
  clearBoard()

  const hash = location.hash.slice(1)
  const game = gameIds.find((id) => routes[id] === hash)
  controller = game === 'wordsearch' || game === 'maze' ? controllers[game] : undefined
  home.hidden = Boolean(game) || hash === 'igre'
  games.hidden = hash !== 'igre'
  play.hidden = !game
  if (!game) {
    if (focus) focusHeading(element(games.hidden ? 'hero-title' : 'games-title'))
    return
  }

  const demo = game === 'crossword' || game === 'sudoku'
  play.dataset.game = game
  title.textContent = examples[game].name
  element('play-description').textContent = examples[game].description
  element('play-label').hidden = !demo
  element('setup-title').textContent = controller ? 'Nastavitve igre' : 'V pripravi'
  element('setup-message').textContent = demo ? 'Spodaj je vzorčni prikaz. Reševanje bo na voljo v prihodnji različici.'
    : ''
  showSetup(focus)
  if (demo) {
    board.hidden = false
    board.innerHTML = renderDemo(game)
  }
}

window.addEventListener('hashchange', () => renderRoute(true))
ui.storageChanged()
renderRoute(Boolean(location.hash))
