export type Game = 'wordsearch' | 'crossword' | 'sudoku' | 'maze'

export const examples = {
  wordsearch: {
    name: 'Osmosmerka',
    description: 'Poišči skrite besede v mreži črk.',
  },
  crossword: {
    name: 'Skandinavska križanka',
    description: 'Sledi puščicam in vpiši gesla po opisih v mreži.',
    clues: ['Material iz debla', 'Žensko ime', 'Plod'],
    rows: ['L..', '.V.', '..D'],
  },
  sudoku: {
    name: 'Sudoku',
    description: 'Dopolni vrstice, stolpce in kvadrate s števili od 1 do 9.',
    rows: [
      '53..7....', '6..195...', '.98....6.',
      '8...6...3', '4..8.3..1', '7...2...6',
      '.6....28.', '...419..5', '....8..79',
    ],
  },
  maze: {
    name: 'Labirint',
    description: 'Poišči pot od začetka do cilja.',
    rows: [
      '###########',
      'S...#.....#',
      '###.#.###.#',
      '#...#.#...#',
      '#.###.#.###',
      '#.....#...#',
      '#.#.#####.#',
      '#.#.......F',
      '###########',
    ],
  },
}

export function renderDemo(game: Exclude<Game, 'wordsearch'>) {
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
    return `<table class="board cross-board" aria-label="Skica mreže s puščicami">
      <tbody>
        <tr><td class="cross-block"></td>${clues.map((clue) => clueCell(clue, '↓', 'navzdol')).join('')}</tr>
        ${rows.map((row, index) => `<tr>${clueCell(clues[index], '→', 'desno')}${letterCells(row)}</tr>`).join('')}
      </tbody>
    </table>`
  }

  const rows = examples.sudoku.rows.map((row) => `<tr>${letterCells(row)}</tr>`).join('')
  return `<table class="board sudoku-board" aria-label="Vzorčni sudoku"><tbody>${rows}</tbody></table>`
}

function letterCells(row: string) {
  return Array.from(row, (letter) => letter === '.'
    ? '<td aria-label="Prazno polje"></td>'
    : `<td>${letter}</td>`,
  ).join('')
}
