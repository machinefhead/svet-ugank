import { lineBetween } from './checker.ts'

export function bindGrid(
  grid: HTMLElement, buttons: HTMLButtonElement[], size: number,
  select: (from: number, to: number) => void, preview: (cells: number[]) => void, announce: (message: string) => void,
) {
  const events = new AbortController()
  const { signal } = events
  let anchor: number | null = null
  let focused = 0
  let locked = false
  let drag: { id: number; start: number } | null = null

  function cellAt(target: EventTarget | null) {
    const button = target instanceof Element ? target.closest<HTMLButtonElement>('[data-cell]') : null
    return button && grid.contains(button) ? Number(button.dataset.cell) : null
  }

  function focus(index: number) {
    buttons[focused].tabIndex = -1
    focused = index
    buttons[focused].tabIndex = 0
    buttons[focused].focus({ preventScroll: true })
  }

  function clear() {
    anchor = null
    preview([])
  }

  function activate(index: number) {
    if (locked) return
    if (anchor === null) {
      anchor = index
      preview([index])
      announce('Izberi še drugo končno črko.')
      return
    }
    const from = anchor
    clear()
    if (from === index) announce('Izbira preklicana.')
    else select(from, index)
  }

  grid.addEventListener('pointerdown', (event) => {
    const start = cellAt(event.target)
    if (locked || drag || event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0 || start === null) return
    drag = { id: event.pointerId, start }
    focus(start)
    event.preventDefault()
  }, { signal })
  window.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return
    if ((event.buttons & 1) === 0) {
      cancelDrag()
      return
    }
    const end = cellAt(document.elementFromPoint(event.clientX, event.clientY))
    const line = end === null ? [] : lineBetween(size, drag.start, end)
    preview(line.length ? line : [drag.start])
  }, { signal })
  window.addEventListener('pointerup', (event) => {
    if (drag?.id !== event.pointerId) return
    const { start } = drag
    drag = null
    const end = cellAt(document.elementFromPoint(event.clientX, event.clientY))
    if (locked || end === null) {
      preview(anchor === null ? [] : [anchor])
      return
    }
    focus(end)
    if (end === start) activate(end)
    else {
      clear()
      select(start, end)
    }
  }, { signal })
  function cancelDrag() {
    if (!drag) return
    drag = null
    preview(anchor === null ? [] : [anchor])
  }
  window.addEventListener('pointercancel', (event) => {
    if (event.pointerId === drag?.id) cancelDrag()
  }, { signal })
  window.addEventListener('blur', cancelDrag, { signal })

  // Native clicks let touch scrolling cancel the gesture before it can select a letter.
  grid.addEventListener('click', (event) => {
    const cell = cellAt(event.target)
    if (cell === null || locked || (event instanceof PointerEvent && event.pointerType === 'mouse' && event.detail !== 0)) return
    focus(cell)
    activate(cell)
  }, { signal })
  grid.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const cell = cellAt(event.target)
    if (cell === null) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!event.repeat) activate(cell)
      return
    }
    const row = Math.floor(cell / size)
    const col = cell % size
    const offsets: Record<string, number> = {
      ArrowUp: row > 0 ? -size : 0, ArrowDown: row + 1 < size ? size : 0,
      ArrowLeft: col > 0 ? -1 : 0, ArrowRight: col + 1 < size ? 1 : 0,
    }
    if (Object.hasOwn(offsets, event.key)) {
      event.preventDefault()
      const next = cell + offsets[event.key]
      focus(next)
      if (anchor !== null) {
        const line = lineBetween(size, anchor, next)
        preview(line.length ? line : [anchor])
      }
    } else if (event.key === 'Escape' && anchor !== null) {
      clear()
      announce('Izbira preklicana.')
    }
  }, { signal })

  return {
    dispose: () => events.abort(),
    lock(next: boolean) {
      locked = next
      if (locked) {
        cancelDrag()
        clear()
      }
    },
  }
}
