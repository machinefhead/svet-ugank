import './styles.css'
import { examples, renderDemo, type Game } from './examples.ts'
import { isTheme, openSlot, readLegacy } from './storage.ts'

const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const home = element('domov')
const games = element('igre')
const play = element('play')
const title = element('play-title')
const board = element('board-panel')
const theme = element<HTMLSelectElement>('theme')

const getStorage = () => window.localStorage
const storedTheme = openSlot(getStorage, 'theme', (value) => isTheme(value) ? value : null)
const legacyTheme = storedTheme.value === null ? readLegacy(getStorage, 'svet-ugank:r2', 'theme') : null
theme.value = storedTheme.value ?? (isTheme(legacyTheme) ? legacyTheme : 'system')
document.documentElement.dataset.theme = theme.value
if (isTheme(legacyTheme) && !storedTheme.invalid) storedTheme.save(legacyTheme)

function showStorageStatus() {
  element('storage-notice').hidden = storedTheme.available
}
theme.addEventListener('change', () => {
  if (!isTheme(theme.value)) return
  document.documentElement.dataset.theme = theme.value
  storedTheme.save(theme.value)
  showStorageStatus()
})

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
const inRedesign = (game: Game) => game === 'wordsearch' || game === 'maze'
const catalog = element('game-list')

for (const game of gameIds) {
  const card = document.createElement('a')
  card.className = 'game-card'
  card.dataset.game = game
  card.href = '#' + routes[game]
  const status = inRedesign(game) ? 'V prenovi' : 'DEMO · V pripravi'
  card.innerHTML = `<span class="game-icon" aria-hidden="true">${icons[game]}</span>
    <span class="card-name">${examples[game].name}</span>
    <span class="card-description">${status}</span>
    <span class="card-arrow" aria-hidden="true">↗</span>`
  catalog.append(card)
}

for (const name of ['Križec-krožec', 'Štiri v vrsto', 'Zračni hokej']) {
  const card = document.createElement('li')
  card.className = 'coming-card'
  card.textContent = name
  element('coming-list').append(card)
}

function focusHeading(heading: HTMLElement) {
  window.scrollTo(0, 0)
  heading.focus({ preventScroll: true })
}

function renderRoute(focus: boolean) {
  const hash = location.hash.slice(1)
  const game = gameIds.find((id) => routes[id] === hash)
  home.hidden = Boolean(game) || hash === 'igre'
  games.hidden = hash !== 'igre'
  play.hidden = !game
  board.hidden = true
  board.replaceChildren()
  if (!game) {
    if (focus) focusHeading(element(games.hidden ? 'hero-title' : 'games-title'))
    return
  }

  const redesign = inRedesign(game)
  play.dataset.game = game
  title.textContent = examples[game].name
  element('play-description').textContent = examples[game].description
  element('play-label').textContent = redesign ? 'V prenovi' : 'DEMO'
  element('play-label').hidden = false
  element('setup-title').textContent = redesign ? 'Igro pripravljamo na novo' : 'V pripravi'
  element('setup-message').textContent = redesign
    ? 'Trenutna izvedba je umaknjena. Kako bomo nadaljevali, določimo po novem dogovoru.'
    : 'Spodaj je vzorčni prikaz. Reševanje bo na voljo v prihodnji različici.'

  if (!redesign) {
    board.hidden = false
    board.innerHTML = renderDemo(game)
  }
  if (focus) focusHeading(title)
}

window.addEventListener('hashchange', () => renderRoute(true))
showStorageStatus()
renderRoute(Boolean(location.hash))
