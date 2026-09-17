import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getValidAccessToken } from './strava-session'
import {
  clearStravaTokens,
  loadStravaTokens,
  saveStravaTokens,
} from '../oauth/strava-token.persistence'

const {
  clearStravaTokensMock,
  loadStravaTokensMock,
  saveStravaTokensMock,
  replaceStravaTokensMock,
  epochMock,
} = vi.hoisted(() => ({
  epochMock: { value: 0 },
  replaceStravaTokensMock: vi.fn(),
  clearStravaTokensMock: vi.fn(async () => {}),
  loadStravaTokensMock: vi.fn(),
  saveStravaTokensMock: vi.fn(async (_tokens: unknown) => {}),
}))

vi.mock('../oauth/strava-token.persistence', () => ({
  getStravaTokenEpoch: () => epochMock.value,
  replaceStravaTokens: replaceStravaTokensMock,
  clearStravaTokens: clearStravaTokensMock,
  loadStravaTokens: loadStravaTokensMock,
  saveStravaTokens: saveStravaTokensMock,
}))

const ENDPOINT = 'https://project.supabase.co/functions/v1/strava-exchange'
const REFRESH_URL = 'https://project.supabase.co/functions/v1/strava-refresh'

const fresh = {
  accessToken: 'access-fresh',
  refreshToken: 'refresh-1',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
}

const stale = {
  accessToken: 'access-stale',
  refreshToken: 'refresh-1',
  expiresAt: new Date(Date.now() - 1000).toISOString(),
}

/** Just inside the safety skew, so it must be treated as already expiring. */
const nearlyExpired = {
  accessToken: 'access-nearly',
  refreshToken: 'refresh-1',
  expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
}

const refreshPayload = {
  tokens: {
    accessToken: 'access-new',
    refreshToken: 'refresh-2',
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  },
}

function stubFetch(response: unknown, status = 200) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  vi.stubEnv('EXPO_PUBLIC_STRAVA_CLIENT_ID', 'client-123')
  vi.stubEnv('EXPO_PUBLIC_STRAVA_ENDPOINT_URL', ENDPOINT)
  epochMock.value = 0
  replaceStravaTokensMock.mockReset()
  replaceStravaTokensMock.mockImplementation(async (epoch: number, tokens: unknown) => {
    if (epoch !== epochMock.value) return false
    epochMock.value++
    if (tokens === null) await clearStravaTokensMock()
    else await saveStravaTokensMock(tokens)
    return true
  })
  clearStravaTokensMock.mockClear()
  loadStravaTokensMock.mockClear()
  saveStravaTokensMock.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getValidAccessToken', () => {
  it('reports disconnected when nothing is stored', async () => {
    loadStravaTokensMock.mockResolvedValue(null)

    await expect(getValidAccessToken()).resolves.toEqual({ status: 'disconnected' })
  })

  it('returns the stored token when it is comfortably valid', async () => {
    loadStravaTokensMock.mockResolvedValue(fresh)

    await expect(getValidAccessToken()).resolves.toEqual({
      status: 'ready',
      accessToken: 'access-fresh',
      sessionEpoch: 0,
    })
    expect(saveStravaTokensMock).not.toHaveBeenCalled()
  })

  it('refreshes, persists and returns the new token when the stored one has expired', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    const fetchMock = stubFetch(refreshPayload)

    await expect(getValidAccessToken()).resolves.toEqual({
      status: 'ready',
      accessToken: 'access-new',
      sessionEpoch: 1,
    })

    expect(fetchMock.mock.calls[0]?.[0]).toBe(REFRESH_URL)
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1].body))).toEqual({
      refreshToken: 'refresh-1',
    })
    // Persisted before it is handed out: Strava already spent the old one.
    expect(saveStravaTokensMock).toHaveBeenCalledWith(refreshPayload.tokens)
  })

  it('refreshes before actual expiry, so a request never dies in flight', async () => {
    loadStravaTokensMock.mockResolvedValue(nearlyExpired)
    stubFetch(refreshPayload)

    await expect(getValidAccessToken()).resolves.toEqual({
      status: 'ready',
      accessToken: 'access-new',
      sessionEpoch: 1,
    })
  })

  it('refreshes exactly once when several callers ask at the same time', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    const fetchMock = stubFetch(refreshPayload)

    const results = await Promise.all([
      getValidAccessToken(),
      getValidAccessToken(),
      getValidAccessToken(),
    ])

    // Strava rotates the refresh token per call: a second concurrent refresh
    // would spend the same token twice and lock the rider out.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    for (const result of results) {
      expect(result).toEqual({ status: 'ready', accessToken: 'access-new', sessionEpoch: 1 })
    }
  })

  it('clears the session when Strava rejects the refresh token', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    stubFetch({ error: 'refresh_rejected' }, 401)

    await expect(getValidAccessToken()).resolves.toEqual({ status: 'expired' })
    expect(clearStravaTokensMock).toHaveBeenCalledTimes(1)
  })

  it('does not clear the session on a transient failure', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    stubFetch({ error: 'strava_unreachable' }, 502)

    const result = await getValidAccessToken()

    expect(result.status).toBe('error')
    // The rider is still connected; offering to reconnect here would be wrong.
    expect(clearStravaTokensMock).not.toHaveBeenCalled()
  })

  it('does not clear the session when the endpoint is unreachable', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network request failed')
      }),
    )

    await expect(getValidAccessToken()).resolves.toMatchObject({ status: 'error' })
    expect(clearStravaTokensMock).not.toHaveBeenCalled()
  })

  it('retries on the next call after a rejected refresh rather than hanging', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    stubFetch({ error: 'strava_unreachable' }, 502)

    await expect(getValidAccessToken()).resolves.toMatchObject({ status: 'error' })

    const fetchMock = stubFetch(refreshPayload)
    await expect(getValidAccessToken()).resolves.toEqual({
      status: 'ready',
      accessToken: 'access-new',
      sessionEpoch: 1,
    })
    // A promise left in flight after a rejection would have hung here instead.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports an error when the refresh URL does not have the expected shape', async () => {
    vi.stubEnv('EXPO_PUBLIC_STRAVA_ENDPOINT_URL', 'https://example.com/somewhere-else')
    loadStravaTokensMock.mockResolvedValue(stale)
    const fetchMock = stubFetch(refreshPayload)

    await expect(getValidAccessToken()).resolves.toMatchObject({ status: 'error' })
    // Posting a refresh at the exchange endpoint would fail silently.
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('session boundaries during refresh', () => {
  it('does not restore a session cleared while a successful refresh was in flight', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    const fetchMock = stubFetch(refreshPayload)
    fetchMock.mockImplementationOnce(async () => {
      epochMock.value++
      return { ok: true, status: 200, json: async () => refreshPayload }
    })
    await expect(getValidAccessToken()).resolves.toEqual({ status: 'disconnected' })
    expect(saveStravaTokensMock).not.toHaveBeenCalled()
  })
  it('does not erase new credentials when an older refresh is rejected', async () => {
    loadStravaTokensMock.mockResolvedValue(stale)
    const fetchMock = stubFetch({ error: 'rejected' }, 401)
    fetchMock.mockImplementationOnce(async () => {
      epochMock.value++
      return { ok: false, status: 401, json: async () => ({ error: 'rejected' }) }
    })
    await expect(getValidAccessToken()).resolves.toEqual({ status: 'disconnected' })
    expect(clearStravaTokensMock).not.toHaveBeenCalled()
  })
  it('does not return credentials read across a concurrent session change', async () => {
    loadStravaTokensMock.mockImplementationOnce(async () => {
      epochMock.value++
      return fresh
    })
    await expect(getValidAccessToken()).resolves.toEqual({ status: 'disconnected' })
  })
})

describe('token persistence wiring', () => {
  it('reads the tokens it stores through the same module', () => {
    expect(loadStravaTokens).toBe(loadStravaTokensMock)
    expect(saveStravaTokens).toBe(saveStravaTokensMock)
    expect(clearStravaTokens).toBe(clearStravaTokensMock)
  })
})
