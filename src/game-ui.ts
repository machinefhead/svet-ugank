export interface GameUI {
  ask(title: string, message: string, action: string, accept: () => void): void
  congratulate(message: string): void
  storageChanged(): void
}

export interface GameController {
  readonly available: boolean
  readonly resumable: boolean
  readonly notice: string
  settings(fields: HTMLElement): () => void
  mount(panel: HTMLElement): void | (() => void)
}

export function selectField(
  parent: HTMLElement, name: string, label: string,
  options: readonly (readonly [string | number, string])[], value: string | number,
) {
  const wrapper = document.createElement('label')
  const input = document.createElement('select')
  input.name = name
  for (const [id, text] of options) input.add(new Option(text, String(id)))
  input.value = String(value)
  wrapper.append(label, input)
  parent.append(wrapper)
  return input
}

export function gameActions(panel: HTMLElement, doHint: () => void, doReveal: () => void) {
  const footer = document.createElement('div')
  footer.className = 'game-actions'
  footer.innerHTML = `<button class="button secondary" type="button">Namig</button>
    <button class="button secondary" type="button">Pokaži rešitev</button>`
  const [hint, reveal] = footer.querySelectorAll('button')
  hint.addEventListener('click', doHint)
  reveal.addEventListener('click', doReveal)
  panel.append(footer)
  return { hint, reveal }
}
