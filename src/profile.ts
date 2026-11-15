import type { LocalData } from './storage.ts'
import { presets, type Level } from './wordsearch/model.ts'

export function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function renderResults(target: HTMLElement, data: LocalData) {
  const player = document.createElement('p')
  player.textContent = `${data.nickname || 'Gost'} · Pravilno rešene osmosmerke: ${data.results.length}`
  target.replaceChildren(player)
  if (!data.results.length) {
    const empty = document.createElement('p')
    empty.textContent = 'Prvega rezultata še ni.'
    target.append(empty)
    return
  }

  const table = document.createElement('table')
  table.className = 'result-table'
  table.innerHTML = '<caption>Najboljši časi</caption><thead><tr><th scope="col">Težavnost</th><th scope="col">Brez namigov</th><th scope="col">Z namigi</th></tr></thead>'
  const body = table.createTBody()
  for (const level of Object.keys(presets) as Level[]) {
    const row = body.insertRow()
    const heading = document.createElement('th')
    heading.scope = 'row'
    heading.textContent = presets[level].label
    row.append(heading)
    for (const assisted of [false, true]) {
      const best = data.results.reduce((min, result) => result.level === level && (result.hints > 0) === assisted
        ? Math.min(min, result.elapsedMs) : min, Infinity)
      row.insertCell().textContent = Number.isFinite(best) ? formatTime(best) : '–'
    }
  }

  const recent = document.createElement('h3')
  recent.textContent = 'Zadnja dokončanja'
  const list = document.createElement('ul')
  list.className = 'recent-results'
  for (const result of [...data.results].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 5)) {
    const item = document.createElement('li')
    const assistance = result.hints === 0 ? 'brez namigov' : result.hints === 1 ? '1 namig' : '2 namiga'
    item.textContent = `${presets[result.level].label} · ${formatTime(result.elapsedMs)} · ${assistance} · ${new Date(result.finishedAt).toLocaleDateString('sl-SI')}`
    list.append(item)
  }
  const note = document.createElement('p')
  note.className = 'result-note'
  note.textContent = 'Čas je orientacijski in teče od začetka uganke, tudi med premori.'
  target.append(table, recent, list, note)
}
