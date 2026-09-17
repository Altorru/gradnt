import { describe, expect, it } from 'vitest'

import { createChunkedStorage, type StringStorage } from './chunked-storage'

function memory() {
  const values = new Map<string, string>()
  const storage: StringStorage = {
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value)
    },
    removeItem: async (key) => {
      values.delete(key)
    },
  }
  return { values, storage }
}

describe('encrypted session chunk storage', () => {
  it('round-trips a large session with multibyte metadata in small values', async () => {
    const { storage, values } = memory()
    const secure = createChunkedStorage(storage)
    const session = JSON.stringify({ access_token: 'x'.repeat(4000), user: '🚴漢'.repeat(1000) })
    await secure.setItem('session', session)
    expect(await secure.getItem('session')).toBe(session)
    for (const value of values.values())
      expect(new TextEncoder().encode(value).length).toBeLessThan(2000)
  })

  it('preserves the previous session when a chunk write fails', async () => {
    const { storage } = memory()
    let fail = false
    const secure = createChunkedStorage({
      ...storage,
      setItem: async (key, value) => {
        if (fail && key.endsWith('.1')) throw new Error('disk_full')
        await storage.setItem(key, value)
      },
    })
    await secure.setItem('session', 'original')
    fail = true
    await expect(secure.setItem('session', 'x'.repeat(1000))).rejects.toThrow('disk_full')
    expect(await secure.getItem('session')).toBe('original')
    fail = false
    await secure.setItem('session', 'replacement')
    expect(await secure.getItem('session')).toBe('replacement')
  })

  it('serializes racing writes and removes all previous chunks', async () => {
    const { storage, values } = memory()
    const secure = createChunkedStorage(storage)
    await Promise.all([
      secure.setItem('session', 'a'.repeat(3000)),
      secure.setItem('session', 'last'),
    ])
    expect(await secure.getItem('session')).toBe('last')
    expect(values.size).toBe(2)
    await secure.removeItem('session')
    expect(await secure.getItem('session')).toBeNull()
    expect(values.size).toBe(0)
  })

  it('rejects a truncated generation rather than returning a partial token', async () => {
    const { storage, values } = memory()
    const secure = createChunkedStorage(storage)
    await secure.setItem('session', 'a'.repeat(1000))
    const chunk = [...values.keys()].find((key) => key.endsWith('.1'))
    if (chunk) values.delete(chunk)
    await expect(secure.getItem('session')).rejects.toThrow('incomplete_auth_storage')
  })
})
