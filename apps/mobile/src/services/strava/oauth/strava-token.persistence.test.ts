import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearStravaTokens,
  getStravaTokenEpoch,
  loadStravaTokens,
  replaceStravaTokens,
  saveStravaTokens,
} from './strava-token.persistence'

const mocks = vi.hoisted(() => ({
  value: null as string | null,
  platform: { OS: 'ios' },
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}))
vi.mock('react-native', () => ({ Platform: mocks.platform }))
vi.mock('expo-secure-store', () => ({
  getItemAsync: mocks.get,
  setItemAsync: mocks.set,
  deleteItemAsync: mocks.remove,
}))
const tokens = {
  accessToken: 'test-access',
  refreshToken: 'test-refresh',
  expiresAt: '2027-01-01T00:00:00.000Z',
}
const newer = { ...tokens, accessToken: 'other-access', refreshToken: 'other-refresh' }

function deferred() {
  let resolve: () => void = () => {
    throw new Error('not_initialized')
  }
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(async () => {
  mocks.platform.OS = 'ios'
  mocks.value = null
  mocks.get.mockReset().mockImplementation(async () => mocks.value)
  mocks.set.mockReset().mockImplementation(async (_key: string, value: string) => {
    mocks.value = value
  })
  mocks.remove.mockReset().mockImplementation(async () => {
    mocks.value = null
  })
  await clearStravaTokens()
  vi.clearAllMocks()
})

describe('credential generation and serialized keychain writes', () => {
  it('rotates only the credentials belonging to the expected generation', async () => {
    await saveStravaTokens(tokens)
    const epoch = getStravaTokenEpoch()
    expect(await replaceStravaTokens(epoch, newer)).toBe(true)
    expect(getStravaTokenEpoch()).toBe(epoch + 1)
    expect(await loadStravaTokens()).toEqual(newer)
    expect(await replaceStravaTokens(epoch, tokens)).toBe(false)
    expect(await loadStravaTokens()).toEqual(newer)
  })
  it('cannot restore tokens after disconnecting', async () => {
    await saveStravaTokens(tokens)
    const epoch = getStravaTokenEpoch()
    await clearStravaTokens()
    expect(await replaceStravaTokens(epoch, newer)).toBe(false)
    expect(await loadStravaTokens()).toBeNull()
  })
  it('cannot clear another session after a rejected refresh', async () => {
    await saveStravaTokens(tokens)
    const epoch = getStravaTokenEpoch()
    await saveStravaTokens(newer)
    expect(await replaceStravaTokens(epoch, null)).toBe(false)
    expect(await loadStravaTokens()).toEqual(newer)
  })
  it('lets a concurrent disconnect win over a pending native write', async () => {
    await saveStravaTokens(tokens)
    const started = deferred()
    const release = deferred()
    mocks.set.mockImplementationOnce(async (_key: string, value: string) => {
      started.resolve()
      await release.promise
      mocks.value = value
    })
    const rotation = replaceStravaTokens(getStravaTokenEpoch(), newer)
    await started.promise
    const disconnect = clearStravaTokens()
    release.resolve()
    expect(await rotation).toBe(false)
    await disconnect
    expect(await loadStravaTokens()).toBeNull()
  })
  it('does not return a keychain read started before a session change', async () => {
    await saveStravaTokens(tokens)
    const started = deferred()
    const release = deferred()
    mocks.get.mockImplementationOnce(async () => {
      const previous = mocks.value
      started.resolve()
      await release.promise
      return previous
    })
    const read = loadStravaTokens()
    await started.promise
    await clearStravaTokens()
    release.resolve()
    expect(await read).toBeNull()
  })
  it('reports failed native writes and allows a later clear to proceed', async () => {
    mocks.set.mockRejectedValueOnce(new Error('keychain_unavailable'))
    await expect(saveStravaTokens(tokens)).rejects.toThrow('keychain_unavailable')
    await clearStravaTokens()
    expect(await loadStravaTokens()).toBeNull()
  })
  it('keeps web credentials in memory and applies the same generation checks', async () => {
    mocks.platform.OS = 'web'
    await saveStravaTokens(tokens)
    const epoch = getStravaTokenEpoch()
    await saveStravaTokens(newer)
    expect(await replaceStravaTokens(epoch, null)).toBe(false)
    expect(await loadStravaTokens()).toEqual(newer)
    await clearStravaTokens()
    expect(await loadStravaTokens()).toBeNull()
    expect(mocks.set).not.toHaveBeenCalled()
    expect(mocks.get).not.toHaveBeenCalled()
  })
})
