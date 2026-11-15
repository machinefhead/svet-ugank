import './styles.css'
import { examples, renderDemo, type Game } from './examples.ts'
import { formatTime, renderResults } from './profile.ts'
import { isTheme, normalizeNickname, openLocalData } from './storage.ts'
import { mountBoard } from './wordsearch/board.ts'
import { isComplete } from './wordsearch/checker.ts'
import { generatePuzzle } from './wordsearch/generator.ts'
import { describePreset, hintLimit, isLevel, presets, puzzleId } from './wordsearch/model.ts'
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
const profileForm = element<HTMLFormElement>('profile-form')
const nickname = element<HTMLInputElement>('nickname')
const profileStatus = element('profile-status')
const congratulations = element<HTMLDialogElement>('congratulations')
const confirmDialog = element<HTMLDialogElement>('confirm')
const newPuzzle = element<HTMLButtonElement>('new-puzzle')
const hint = element<HTMLButtonElement>('hint')
const reveal = element<HTMLButtonElement>('reveal')

const local = openLocalData(() => window.localStorage)
const { data } = local
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
for (const game of gameIds) {
  const { name, description } = examples[game]
  const card = document.createElement('a')
  card.className = 'game-card'
  card.dataset.game = game
  card.href = '#' + routes[game]
  card.innerHTML = `
    <span class="game-icon" aria-hidden="true">${icons[game]}</span>
    <span class="card-name">${name}</span>
    <span class="card-description">${game === 'wordsearch' ? description : 'DEMO · Samo vzorčni prikaz'}</span>
    <span class="card-arrow" aria-hidden="true">↗</span>`
  gameList.append(card)
}

function showStorageStatus() {
  element('storage-notice').hidden = local.available
  element('storage-description').textContent = local.available
    ? 'Napredek in rezultati so na tej napravi. Brisanje podatkov brskalnika jih odstrani.'
    : 'Rezultati so na voljo samo v tem odprtem zavihku, ker lokalno shranjevanje ni na voljo.'
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
for (const [level, { label, size }] of Object.entries(presets)) {
  difficulty.add(new Option(`${label} · ${size} × ${size}`, level))
}

function showNextDirections() {
  element('next-directions').textContent = presets[data.nextLevel].directionLabel
}

difficulty.value = data.nextLevel
showNextDirections()
difficulty.addEventListener('change', () => {
  if (!isLevel(difficulty.value)) return
  data.nextLevel = difficulty.value
  showNextDirections()
  save()
})

function createPuzzle() {
  try {
    const level = data.nextLevel
    // Avoid reusing a puzzle ID already in progress or recorded as completed.
    const used = new Set([puzzle?.id, ...data.results.map((result) => result.puzzleId)])
    let seed = crypto.getRandomValues(new Uint32Array(1))[0]
    while (used.has(puzzleId(level, seed))) seed = (seed + 1) >>> 0
    const definition = generatePuzzle(level, seed)
    data.play = startPuzzle(level, seed, Date.now())
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
  const legacy = puzzle.revision === 1 ? ' (R2)' : ''
  element('applied-difficulty').textContent =
    `Trenutno: ${label}${legacy} · ${puzzle.size} × ${puzzle.size} · ${directionLabel}`
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
    element('congratulations-text').textContent = 'Našel si vse skrite besede.' + detail
    congratulations.showModal()
  } else {
    save()
    updateBoard()
    board.announce(`Najdena beseda: ${move.word}.`, 'success')
  }
}

let pendingAction: (() => void) | null = null
function ask(title: string, text: string, action: string, run: () => void) {
  element('confirm-title').textContent = title
  element('confirm-text').textContent = text
  element('confirm-action').textContent = action
  pendingAction = run
  confirmDialog.returnValue = 'cancel'
  confirmDialog.showModal()
}
confirmDialog.addEventListener('close', () => {
  const run = pendingAction
  pendingAction = null
  if (confirmDialog.returnValue === 'accept' && location.hash === '#osmosmerka') run?.()
})

newPuzzle.addEventListener('click', () => {
  const replace = () => { if (createPuzzle()) board?.focus() }
  if (puzzle && data.play && !isComplete(puzzle, data.play.found)) {
    ask('Začneš novo uganko?', 'Trenutna uganka še ni rešena. Z novo uganko izgubiš njen napredek.',
      'Zamenjaj uganko', replace)
  } else replace()
})
hint.addEventListener('click', () => {
  if (!puzzle || !data.play || !board) return
  const next = useHint(puzzle, data.play)
  if (next === data.play) return
  data.play = next
  save()
  updateBoard()
  board.announce(`Namig: označena je začetna črka za besedo ${next.hints.at(-1)}.`, 'warning')
  board.focusHint(next.hints.at(-1)!)
})
reveal.addEventListener('click', () => {
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
  } else if (game) {
    heading = playTitle
    play.dataset.game = game
    playTitle.textContent = examples[game].name
    element('play-label').textContent = game === 'wordsearch' ? 'Igralna uganka' : 'DEMO · Vzorčni prikaz'
    element('play-description').textContent = game === 'wordsearch' ? examples[game].description :
      'To je statičen prikaz zaslona. Reševanje v tej različici še ni na voljo.'
    element('play-options').hidden = game !== 'wordsearch'
    boardPanel.replaceChildren()
    board = null
    if (game === 'wordsearch') {
      hint.disabled = reveal.disabled = !puzzle
      if (puzzle && data.play) mountWordsearch()
      else createPuzzle()
    } else boardPanel.innerHTML = renderDemo(game)
  }
  if (focus) {
    window.scrollTo(0, 0)
    heading.focus({ preventScroll: true })
  }
}

window.addEventListener('hashchange', () => renderRoute(true))
showStorageStatus()
renderRoute(Boolean(location.hash))
