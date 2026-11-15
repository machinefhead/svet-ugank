export type Game = 'wordsearch' | 'crossword' | 'sudoku' | 'maze'

export const examples = {
  wordsearch: {
    name: 'Osmosmerka',
    description: 'Poišči skrite besede v mreži črk.',
    rows: ['MIZAPRE', 'OBRTULV', 'LKSVCOI', 'JERODNA', 'CUHALSB', 'SONCEIT', 'NGORAČM'],
    words: ['MIZA', 'VODA', 'SONCE', 'GORA'],
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
} satisfies Record<Game, { name: string; description: string; rows: string[]; words?: string[]; clues?: string[] }>
