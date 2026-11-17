import { bindJoystick } from './joystick.ts'
import { type Direction, type MazePuzzle } from './model.ts'
import type { MazePlay } from './session.ts'

const keys: Record<string, Direction> = {
  arrowup: 'up', w: 'up', arrowright: 'right', d: 'right',
  arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left',
}

export const directionNames = { up: 'gor', right: 'desno', down: 'dol', left: 'levo' } as const
const arrows = { up: '↑', right: '→', down: '↓', left: '←' } as const

function openPath({ width, open }: MazePuzzle) {
  const runs: string[] = []
  for (let row = 1; row < width - 1; row++) {
    let col = 1
    while (col < width - 1) {
      if (!open[row * width + col]) {
        col++
        continue
      }
      const start = col
      while (open[row * width + col]) col++
      const length = col - start
      runs.push(`M${start} ${row}h${length}v1h-${length}z`)
    }
  }
  return runs.join('')
}

export function mountMazeBoard(
  panel: HTMLElement, puzzle: MazePuzzle, move: (direction: Direction) => boolean, choose: (cell: number) => void,
) {
  const events = new AbortController()
  const { signal } = events
  const { width, start, goal, solution } = puzzle
  const x = (cell: number) => cell % width + 0.5
  const y = (cell: number) => Math.floor(cell / width) + 0.5
  panel.innerHTML = `
    <svg class="maze-grid" viewBox="0 0 ${width} ${width}" role="group" tabindex="0"
        aria-label="Mreža labirinta" aria-describedby="maze-instructions maze-status">
      <rect class="maze-wall" width="${width}" height="${width}"/>
      <path class="maze-floor" shape-rendering="crispEdges" d="${openPath(puzzle)}"/>
      <path class="maze-trail" shape-rendering="crispEdges"/>
      <polyline class="maze-solution" points="${solution.map((cell) => `${x(cell)},${y(cell)}`).join(' ')}" visibility="hidden"/>
      <rect class="maze-start" width=".8" height=".8" x="${x(start) - 0.4}" y="${y(start) - 0.4}"/>
      <rect class="maze-goal" width=".8" height=".8" x="${x(goal) - 0.4}" y="${y(goal) - 0.4}"/>
      <circle class="maze-player" r=".36"/>
    </svg>
    <p id="maze-instructions" class="board-instructions">S palico, puščicami ali tipkami W, A, S, D vodi piko od vijoličnega začetka do zelenega cilja. Lahko klikneš tudi sosednje odprto polje.</p>
    <div class="maze-controls">
      <div class="joystick" tabindex="-1" role="group" aria-label="Krmilna palica"><span class="joystick-thumb"></span></div>
      <div class="maze-directions" role="group" aria-label="Smerni gumbi">
        ${Object.entries(arrows).map(([direction, arrow]) =>
          `<button class="button secondary" type="button" data-direction="${direction}" aria-label="${directionNames[direction as Direction]}">${arrow}</button>`).join('')}
      </div>
    </div>
    <div class="board-feedback maze-feedback">
      <p id="maze-status" class="board-progress" role="status"></p>
      <p class="board-message" role="status"></p>
    </div>`
  const grid = panel.querySelector<SVGSVGElement>('.maze-grid')!
  const player = grid.querySelector('.maze-player')!
  const trail = grid.querySelector('.maze-trail')!
  const route = grid.querySelector('.maze-solution')!
  const status = panel.querySelector<HTMLElement>('#maze-status')!
  const message = panel.querySelector<HTMLElement>('.board-message')!
  const buttons = [...panel.querySelectorAll<HTMLButtonElement>('[data-direction]')]
  let locked = false
  let lastTrail: readonly number[] | null = null

  grid.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || !Object.hasOwn(keys, event.key.toLowerCase())) return
    event.preventDefault()
    if (!locked) move(keys[event.key.toLowerCase()])
  }, { signal })
  grid.addEventListener('click', (event) => {
    if (locked) return
    const { left, top, width: viewWidth, height } = grid.getBoundingClientRect()
    const col = Math.floor((event.clientX - left) * width / viewWidth)
    const row = Math.floor((event.clientY - top) * width / height)
    if (col >= 0 && col < width && row >= 0 && row < width) choose(row * width + col)
  }, { signal })
  buttons.forEach((button) => button.addEventListener('click', () => {
    if (!locked) move(button.dataset.direction as Direction)
  }, { signal }))
  const stop = bindJoystick(panel.querySelector<HTMLElement>('.joystick')!, (direction) => !locked && move(direction), signal)

  return {
    stop,
    dispose: () => events.abort(),
    announce(text: string, tone = '') {
      message.textContent = text
      message.dataset.tone = tone
    },
    paint(play: MazePlay, viewing: boolean) {
      locked = viewing || play.position === goal
      if (locked) stop()
      player.setAttribute('cx', String(x(play.position)))
      player.setAttribute('cy', String(y(play.position)))
      if (lastTrail !== play.visited) {
        trail.setAttribute('d', play.visited.map((cell) => `M${cell % width} ${Math.floor(cell / width)}h1v1h-1z`).join(''))
        lastTrail = play.visited
      }
      route.setAttribute('visibility', viewing ? 'visible' : 'hidden')
      const text = viewing ? 'Označena je celotna pot od začetka do cilja.'
        : play.position === goal ? 'Cilj je dosežen.' : 'Cilj je zeleni kvadrat v spodnjem desnem kotu.'
      if (status.textContent !== text) status.textContent = text
      buttons.forEach((button) => button.setAttribute('aria-disabled', String(locked)))
    },
  }
}
