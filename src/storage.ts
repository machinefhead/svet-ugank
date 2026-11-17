type Store = Pick<Storage, 'getItem' | 'setItem'>
type GetStore = () => Store

export type Theme = 'system' | 'light' | 'dark'
export const isTheme = (value: unknown): value is Theme => value === 'system' || value === 'light' || value === 'dark'

export function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}

export function readLegacy(getStore: GetStore, key: string) {
  try {
    return record(JSON.parse(getStore().getItem(key) ?? 'null'))
  } catch {
    return null
  }
}

export function openSlot<T>(getStore: GetStore, name: string, decode: (value: unknown) => T | null, encode: (value: T) => unknown = (value) => value) {
  const key = 'svet-ugank:r4:' + name
  const version = 1
  let value: T | null = null
  let invalid = false
  let future = false
  let available = false

  try {
    const store = getStore()
    const raw = store.getItem(key)
    if (raw !== null) {
      try {
        const entry = record(JSON.parse(raw))
        future = typeof entry?.version === 'number' && entry.version > version
        if (entry?.version === version) value = decode(entry.value)
      } catch {
        // A corrupt session can be replaced by an explicit new start.
      }
      invalid = value === null
    }
    if (!future) {
      if (raw !== null) store.setItem(key, raw)
      available = true
    }
  } catch {
    // Reads and writes may be restricted by the browser.
  }

  return {
    get value() { return value },
    get invalid() { return invalid },
    get available() { return available },
    save(next: T) {
      value = next
      invalid = false
      if (!future) {
        try {
          getStore().setItem(key, JSON.stringify({ version, value: encode(next) }))
          available = true
        } catch {
          available = false
        }
      }
      return available
    },
  }
}

export function savedGameNotice(invalid: boolean, hasSession: boolean, hasLegacy: boolean) {
  if (invalid) return 'Shranjene uganke ni bilo mogoče obnoviti. Začni novo igro.'
  if (!hasSession && hasLegacy) return 'Prejšnja uganka je iz stare različice. Za igranje začni novo igro.'
  return ''
}
