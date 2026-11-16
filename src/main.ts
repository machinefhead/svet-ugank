import './styles.css'
import { examples, renderDemo, type Game } from './examples.ts'
import { setupMaze } from './maze/game.ts'
import { formatTime, renderResults } from './profile.ts'
import { isTheme, normalizeNickname, openLocalData } from './storage.ts'
import { mountBoard } from './wordsearch/board.ts'
import { isComplete } from './wordsearch/checker.ts'
import { generatePuzzle, generateConfiguredPuzzle, configuredGenerator } from './wordsearch/generator.ts'
import { customDirections, customQuantities, customSizes, describePreset, hintLimit,
  isLevel, presets, puzzleId } from './wordsearch/model.ts'
import { recordResult, selectWord, startPuzzle, useHint } from './wordsearch/session.ts'

const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

const home = element('domov')
const games = element('igre')
const gameList = element('game-list')
const play = element('play')
const playTitle = element('play-title')
const boardPanel = element('board-panel')
const theme = element<HTMLSelectElement>('theme')
const difficulty = element<HTMLSelectElement>('difficulty')
const wordsearchSize = element<HTMLSelectElement>('wordsearch-size')
const wordsearchDirections = element<HTMLSelectElement>('wordsearch-directions')
const wordsearchCount = element<HTMLSelectElement>('wordsearch-count')
const profileForm = element<HTMLFormElement>('profile-form')
const nickname = element<HTMLInputElement>('nickname')
const profileStatus = element('profile-status')
const congratulations = element<HTMLDialogElement>('congratulations')
const confirmDialog = element<HTMLDialogElement>('confirm')
const newPuzzle = element<HTMLButtonElement>('new-puzzle')
const hint = element<HTMLButtonElement>('hint')
const reveal = element<HTMLButtonElement>('reveal')
const applied = element('applied-difficulty')
const nextDirections = element('next-directions')

const local = openLocalData(() => window.localStorage)
const { data } = local
const maze = setupMaze({
  panel: boardPanel, size: element<HTMLSelectElement>('maze-size'), level: element<HTMLSelectElement>('maze-level'),
  applied, hint, reveal, ask, congratulate, storageChanged: showStorageStatus,
})

let puzzle = local.puzzle
let board: ReturnType<typeof mountBoard> | null = null

const routes = {
  wordsearch: 'osmosmerka', crossword: 'krizanka', sudoku: 'sudoku', maze: 'labirint',
} as const
const icons: Record<Game, string> = {
  wordsearch: '<span>A</span><span>B</span><span>U</span><span>G</span>',
  crossword: '<span>→</span><span></span><span></span><span>↓</span>',
  sudoku: '<span>5</span><span></span><span></span><span>8</span>',
  maze: '<span></span><span></span><span></span><span>●</span>',
}
const gameIds = Object.keys(routes) as Game[]
const isPlayable = (game: Game) => game === 'wordsearch' || game === 'maze'
for (const game of gameIds) {
  const { name, description } = examples[game]
  const card = document.createElement('a')
  card.className = 'game-card'
  card.dataset.game = game
  card.href = '#' + routes[game]
  card.innerHTML = `
    <span class="game-icon" aria-hidden="true">${icons[game]}</span>
    <span class="card-name">${name}</span>
    <span class="card-description">${isPlayable(game) ? description : 'DEMO · Samo vzorčni prikaz'}</span>
    <span class="card-arrow" aria-hidden="true">↗</span>`
  gameList.append(card)
}

function showStorageStatus() {
  const available = local.available && maze.available
  element('storage-notice').hidden = available
  element('storage-description').textContent = available
    ? 'Napredek in rezultati so na tej napravi. Brisanje podatkov brskalnika jih odstrani.'
    : 'Če shranjevanje za igro ni na voljo, je njen novi napredek viden samo v tem zavihku.'
}

function save() {
  const saved = local.save()
  showStorageStatus()
  return saved
}

theme.value = data.theme
document.documentElement.dataset.theme = data.theme
theme.addEventListener('change', () => {
  if (!isTheme(theme.value)) return
  data.theme = theme.value
  document.documentElement.dataset.theme = data.theme
  save()
})
profileForm.addEventListener('submit', (event) => {
  event.preventDefault()
  data.nickname = normalizeNickname(nickname.value)
  nickname.value = data.nickname
  profileStatus.textContent = save() ? 'Vzdevek je posodobljen na tej napravi.' : 'Vzdevek je posodobljen v tem zavihku.'
  renderResults(element('results'), data)
})
for (const [level, { label }] of Object.entries(presets)) {
  difficulty.add(new Option(label, level))
}
for (const size of customSizes) wordsearchSize.add(new Option(`${size} × ${size}`, String(size)))
const directionNames = { 2: 'Desno in dol', 4: 'Naprej + diagonali', 8: 'Vseh 8 smeri' }
for (const directions of customDirections) {
  wordsearchDirections.add(new Option(directionNames[directions], String(directions)))
}
const quantityNames = { few: 'Manj', normal: 'Običajno', many: 'Več' }
for (const quantity of customQuantities) wordsearchCount.add(new Option(quantityNames[quantity], quantity))
difficulty.value = data.nextLevel
wordsearchSize.value = String(data.nextOptions.size)
wordsearchDirections.value = String(data.nextOptions.directions)
wordsearchCount.value = data.nextOptions.quantity

function showNextDirections() {
  const config = configuredGenerator(data.nextLevel, data.nextOptions)
  nextDirections.textContent = `Naslednja: ${config.wordCount} besed · ${directionNames[data.nextOptions.directions]}. Spremembe veljajo šele ob »Nova uganka«.`
}

function saveNextWordsearchOptions() {
  if (!isLevel(difficulty.value)) return
  data.nextLevel = difficulty.value
  const size = Number(wordsearchSize.value)
  const directions = Number(wordsearchDirections.value)
  const quantity = wordsearchCount.value
  if (!customSizes.some((value) => value === size) ||
      !customDirections.some((value) => value === directions) ||
      !customQuantities.some((value) => value === quantity)) return
  data.nextOptions = {
    size: size as typeof customSizes[number],
    directions: directions as typeof customDirections[number],
    quantity: quantity as typeof customQuantities[number],
  }
  showNextDirections()
  save()
}
for (const select of [difficulty, wordsearchSize, wordsearchDirections, wordsearchCount]) {
  select.addEventListener('change', saveNextWordsearchOptions)
}
showNextDirections()

function createPuzzle() {
  try {
    const level = data.nextLevel
    // Avoid reusing a puzzle ID already in progress or recorded as completed.
    const options = data.nextOptions
    const used = new Set([puzzle?.id, ...data.results.map((result) => result.puzzleId)])
    let seed = crypto.getRandomValues(new Uint32Array(1))[0]
    while (used.has(puzzleId(level, seed, 2, options))) seed = (seed + 1) >>> 0
    const definition = generateConfiguredPuzzle(level, options, seed)
    data.play = startPuzzle(level, seed, Date.now(), options)
    puzzle = definition
    save()
    mountWordsearch()
    return true
  } catch (error) {
    const message = error instanceof Error && error.name === 'RangeError'
      ? error.message : 'Nove uganke ni bilo mogoče pripraviti. Poskusi znova.'
    if (board) board.announce(message, 'error')
    else boardPanel.textContent = message
    return false
  }
}

function mountWordsearch() {
  if (!puzzle || !data.play) return
  board = mountBoard(boardPanel, puzzle, select)
  const { label, directionLabel } = describePreset(puzzle.level, puzzle.revision)
  const legacy = puzzle.revision === 1 ? ' (stara uganka)' : ''
  const directionsText = puzzle.options
    ? { 2: 'Desno in dol', 4: '4 smeri', 8: '8 smeri' }[puzzle.options.directions]
    : directionLabel
  applied.textContent =
    `Trenutna uganka: ${label}${legacy} · ${puzzle.size} × ${puzzle.size} · ${puzzle.placements.length} besed · ${directionsText}`
  updateBoard()
}

function updateBoard() {
  if (!puzzle || !data.play || !board) return
  board.paint(data.play)
  const complete = isComplete(puzzle, data.play.found)
  const remaining = hintLimit - data.play.hints.length
  const hasHintTarget = puzzle.placements.some(({ word }) => !data.play!.found.includes(word) && !data.play!.hints.includes(word))
  hint.disabled = complete || data.play.revealed || remaining === 0 || !hasHintTarget
  hint.textContent = `Namig (${remaining})`
  reveal.disabled = complete
  reveal.textContent = data.play.revealed ? 'Znova pokaži rešitev' : 'Pokaži rešitev'
}

function select(from: number, to: number) {
  if (!puzzle || !data.play || !board) return
  const move = selectWord(puzzle, data.play, from, to)
  if (move.status === 'closed') return
  if (move.status === 'invalid') {
    board.showInvalid(from, to)
    return
  }
  if (move.status === 'already-found') {
    board.announce(`${move.word} je že med najdenimi.`)
    return
  }
  data.play = move.play
  if (move.status === 'complete') {
    const previous = data.results
    data.results = recordResult(previous, puzzle, move.play, Date.now())
    const saved = save()
    updateBoard()
    const result = data.results.at(-1)
    const detail = data.results !== previous && result
      ? ` Čas: ${formatTime(result.elapsedMs)}. ${saved ? 'Rezultat je shranjen na tej napravi.' : 'Rezultat je viden v tem zavihku.'}`
      : ''
    congratulate('Našel si vse skrite besede.' + detail)
  } else {
    save()
    updateBoard()
    board.announce(`Najdena beseda: ${move.word}.`, 'success')
  }
}

function congratulate(message: string) {
  element('congratulations-text').textContent = message
  congratulations.showModal()
}

let pendingAction: { route: string; run: () => void } | null = null
function ask(title: string, text: string, action: string, run: () => void) {
  element('confirm-title').textContent = title
  element('confirm-text').textContent = text
  element('confirm-action').textContent = action
  pendingAction = { route: location.hash, run }
  confirmDialog.returnValue = 'cancel'
  confirmDialog.showModal()
}
confirmDialog.addEventListener('close', () => {
  const action = pendingAction
  pendingAction = null
  if (confirmDialog.returnValue === 'accept' && action?.route === location.hash) action.run()
})

newPuzzle.addEventListener('click', () => {
  if (location.hash === '#labirint') return maze.newPuzzle()
  const replace = () => { if (createPuzzle()) board?.focus() }
  if (puzzle && data.play && !isComplete(puzzle, data.play.found)) {
    ask('Začneš novo uganko?', 'Trenutna uganka še ni rešena. Z novo uganko izgubiš njen napredek.',
      'Zamenjaj uganko', replace)
  } else replace()
})
hint.addEventListener('click', () => {
  if (location.hash === '#labirint') return maze.hint()
  if (!puzzle || !data.play || !board) return
  const next = useHint(puzzle, data.play)
  if (next === data.play) return
  data.play = next
  save()
  updateBoard()
  const hintedWord = next.hints.at(-1)!
  const placement = puzzle.placements.find(({ word }) => word === hintedWord)!
  const step = placement.cells[1] - placement.cells[0]
  const orientation = Math.abs(step) === 1 ? 'vodoravno' :
    Math.abs(step) === puzzle.size ? 'navpično' : 'diagonalno'
  board.announce(`Namig: beseda ${hintedWord} je postavljena ${orientation}. Začetno polje ostane skrito.`, 'warning')
  board.focusHint(hintedWord)
})
reveal.addEventListener('click', () => {
  if (location.hash === '#labirint') return maze.reveal()
  if (!data.play || !board) return
  ask('Pokažem rešitev?', 'Ogled ne spremeni najdenih besed. Po ogledu bo uganka ostala za pregled in se ne bo štela med rezultate.',
    'Pokaži rešitev', () => {
      if (!data.play || !board) return
      data.play = { ...data.play, revealed: true }
      save()
      updateBoard()
      board.viewSolution()
    })
})

function renderRoute(focus: boolean) {
  const route = location.hash.slice(1)
  const game = gameIds.find((key) => routes[key] === route)
  home.hidden = route === 'igre' || Boolean(game)
  games.hidden = route !== 'igre'
  play.hidden = !game
  pendingAction = null
  if (confirmDialog.open) confirmDialog.close()
  if (congratulations.open) congratulations.close()
  let heading = element('hero-title')
  if (!games.hidden) {
    heading = element('games-title')
  } else if (!home.hidden) {
    nickname.value = data.nickname
    profileStatus.textContent = ''
    renderResults(element('results'), data)
    maze.renderResults(element('maze-results'))
  } else if (game) {
    heading = playTitle
    play.dataset.game = game
    playTitle.textContent = examples[game].name
    element('play-label').textContent = isPlayable(game) ? 'Igralna uganka' : 'DEMO · Vzorčni prikaz'
    element('play-description').textContent = isPlayable(game) ? examples[game].description :
      'To je statičen prikaz zaslona. Reševanje v tej različici še ni na voljo.'
    element('play-options').hidden = !isPlayable(game)
    element('play-bottom-actions').hidden = !isPlayable(game)
    element('wordsearch-fields').hidden = game !== 'wordsearch'
    element('maze-fields').hidden = game !== 'maze'
    nextDirections.hidden = game !== 'wordsearch'
    applied.textContent = ''
    boardPanel.replaceChildren()
    board = null
    if (game === 'wordsearch') {
      hint.disabled = reveal.disabled = !puzzle
      hint.textContent = 'Namig'
      reveal.textContent = 'Pokaži rešitev'
      if (puzzle && data.play) mountWordsearch()
      else createPuzzle()
    } else if (game === 'maze') maze.open()
    else boardPanel.innerHTML = renderDemo(game)
  }
  if (focus) {
    window.scrollTo(0, 0)
    heading.focus({ preventScroll: true })
  }
}

window.addEventListener('hashchange', () => renderRoute(true))
showStorageStatus()
renderRoute(Boolean(location.hash))
