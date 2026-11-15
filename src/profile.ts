import type { LocalData } from './storage.ts'
import { describePreset, presets, revision } from './wordsearch/model.ts'
import type { Result } from './wordsearch/session.ts'

export function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function resultList(results: readonly Result[]) {
  const list = document.createElement('ul')
  list.className = 'recent-results'
  for (const result of results) {
    const item = document.createElement('li')
    const { label } = describePreset(result.level, result.revision)
    const assistance = result.hints === 0 ? 'brez namigov' : result.hints === 1 ? '1 namig' : '2 namiga'
    item.textContent = `${label} · ${formatTime(result.elapsedMs)} · ${assistance} · ${new Date(result.finishedAt).toLocaleDateString('sl-SI')}`
    list.append(item)
  }
  return list
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

  const sorted = [...data.results].sort((a, b) => b.finishedAt - a.finishedAt)
  const current = sorted.filter((result) => result.revision === revision)
  const legacy = sorted.filter((result) => result.revision === 1)
  const details = document.createElement('details')
  details.className = 'result-details'
  const summary = document.createElement('summary')
  summary.textContent = 'Časi in zgodovina'
  details.append(summary)
  if (current.length) {
    const table = document.createElement('table')
    table.className = 'result-table'
    table.innerHTML = '<caption>Najboljši časi · R2.1</caption><thead><tr><th scope="col">Težavnost</th><th scope="col">Brez namigov</th><th scope="col">Z namigi</th></tr></thead>'
    const body = table.createTBody()
    for (const [level, preset] of Object.entries(presets)) {
      const row = body.insertRow()
      const heading = document.createElement('th')
      heading.scope = 'row'
      heading.textContent = preset.label
      row.append(heading)
      for (const assisted of [false, true]) {
        const best = current.reduce((min, result) => result.level === level && (result.hints > 0) === assisted
          ? Math.min(min, result.elapsedMs) : min, Infinity)
        row.insertCell().textContent = Number.isFinite(best) ? formatTime(best) : '–'
      }
    }
    const recent = document.createElement('h3')
    recent.textContent = 'Zadnja dokončanja · R2.1'
    details.append(table, recent, resultList(current.slice(0, 5)))
  }

  if (legacy.length) {
    const history = document.createElement('details')
    history.className = 'legacy-results'
    const title = document.createElement('summary')
    title.textContent = `Dokončanja po prejšnjih pravilih · R2 (${legacy.length})`
    history.append(title, resultList(legacy))
    details.append(history)
  }
  const note = document.createElement('p')
  note.className = 'result-note'
  note.textContent = 'Čas je orientacijski in teče od začetka uganke, tudi med premori.'
  details.append(note)
  target.append(details)
}
