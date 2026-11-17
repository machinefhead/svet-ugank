import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isTheme, openSlot, readLegacy, savedGameNotice } from '../src/storage.ts'

function memoryStorage(entries) {
  const data = new Map(entries)
  return { getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), data }
}

const decodeTheme = (value) => isTheme(value) ? value : null

test('theme is carried into a new key, and legacy, other-site and profile data remain inert', () => {
  const old = '{"theme":"dark","nickname":"Gost","results":[{"elapsedMs":123}],"play":{}}'
  const oldMaze = '{"active":{},"results":[{}]}'
  const storage = memoryStorage([['svet-ugank:r2', old], ['svet-ugank:maze', oldMaze], ['other', 'data']])
  const getStorage = () => storage
  const theme = openSlot(getStorage, 'theme', decodeTheme)
  assert.ok(savedGameNotice(false, false, Boolean(readLegacy(getStorage, 'svet-ugank:r2', 'play'))))
  assert.equal(theme.save(decodeTheme(readLegacy(getStorage, 'svet-ugank:r2', 'theme'))), true)
  assert.equal(openSlot(getStorage, 'theme', decodeTheme).value, 'dark')
  assert.deepEqual([...storage.data], [
    ['svet-ugank:r2', old],
    ['svet-ugank:maze', oldMaze],
    ['other', 'data'],
    ['svet-ugank:r4:theme', '{"version":1,"value":"dark"}'],
  ])
})

test('corrupt data has a notice, future data is protected and blocked storage keeps memory state', () => {
  const key = 'svet-ugank:r4:theme'
  const storage = memoryStorage([[key, '{']])
  const getStorage = () => storage
  const corrupt = openSlot(getStorage, 'theme', decodeTheme)
  assert.equal(corrupt.value, null)
  assert.ok(savedGameNotice(corrupt.invalid, false, false))
  assert.equal(corrupt.save('light'), true)
  assert.equal(openSlot(getStorage, 'theme', decodeTheme).value, 'light')
  const future = '{"version":999,"value":"dark"}'
  storage.setItem(key, future)
  assert.equal(openSlot(getStorage, 'theme', decodeTheme).save('system'), false)
  assert.equal(storage.getItem(key), future)
  const blocked = openSlot(() => { throw new Error('blocked') }, 'theme', decodeTheme)
  assert.equal(blocked.save('dark'), false)
  assert.equal(blocked.value, 'dark')
})
