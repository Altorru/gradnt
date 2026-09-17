import { beforeEach, describe, expect, it, vi } from 'vitest'

import { HttpStravaTokenBroker } from './strava-token-broker.http'

vi.mock('@/services/supabase/client', () => ({ getSupabaseClient: () => null }))

const { replaceStravaTokens } = vi.hoisted(() => ({ replaceStravaTokens: vi.fn(async () => true) }))

vi.mock('./strava-token.persistence', () => ({ replaceStravaTokens, getStravaTokenEpoch: () => 0 }))

const EXCHANGE_URL = 'https://project.supabase.co/functions/v1/strava-exchange'

const validPayload = {
  athleteId: 'athlete-123',
  displayName: 'Rider One',
  grantedScopes: ['profile:read_all', 'activity:read_all'],
  tokens: {
    accessToken: 'access-abc',
    refreshToken: 'refresh-abc',
    expiresAt: '2026-09-15T12:00:00.000Z',
  },
}

function stubFetch(response: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok,
    status,
    json: async () => response,
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('HttpStravaTokenBroker', () => {
  beforeEach(() => {
    replaceStravaTokens.mockReset()
    replaceStravaTokens.mockResolvedValue(true)
    vi.unstubAllGlobals()
  })

  it('posts the authorization code to the exchange endpoint', async () => {
    const fetchMock = stubFetch(validPayload)

    await new HttpStravaTokenBroker(EXCHANGE_URL).exchangeCode('code-abc')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(EXCHANGE_URL)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ code: 'code-abc' })
  })

  it('returns a normalized connection and drops scopes GRADNT does not know', async () => {
    stubFetch({ ...validPayload, grantedScopes: ['profile:read_all', 'unknown_scope'] })

    const connection = await new HttpStravaTokenBroker(EXCHANGE_URL).exchangeCode('code-abc')

    expect(connection).toEqual({
      athleteId: 'athlete-123',
      displayName: 'Rider One',
      grantedScopes: ['profile:read_all'],
    })
  })

  it('persists the returned tokens', async () => {
    stubFetch(validPayload)

    await new HttpStravaTokenBroker(EXCHANGE_URL).exchangeCode('code-abc')

    expect(replaceStravaTokens).toHaveBeenCalledWith(0, validPayload.tokens)
  })

  it('rejects an exchange completed after the credential session changed', async () => {
    stubFetch(validPayload)
    replaceStravaTokens.mockResolvedValueOnce(false)
    await expect(new HttpStravaTokenBroker(EXCHANGE_URL).exchangeCode('old-code')).rejects.toThrow(
      'session changed during authorization',
    )
  })

  it('throws when the endpoint responds with an error status', async () => {
    stubFetch({ error: 'strava_exchange_failed' }, false, 502)

    await expect(new HttpStravaTokenBroker(EXCHANGE_URL).exchangeCode('code-abc')).rejects.toThrow(
      'exchange endpoint returned 502',
    )
    expect(replaceStravaTokens).not.toHaveBeenCalled()
  })

  it('throws when the payload does not match the contract', async () => {
    stubFetch({ ...validPayload, tokens: { accessToken: '', refreshToken: '', expiresAt: 'nope' } })

    await expect(new HttpStravaTokenBroker(EXCHANGE_URL).exchangeCode('code-abc')).rejects.toThrow(
      'unexpected payload',
    )
    expect(replaceStravaTokens).not.toHaveBeenCalled()
  })

  it('throws a descriptive error when the endpoint is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Network request failed')
      }),
    )

    await expect(new HttpStravaTokenBroker(EXCHANGE_URL).exchangeCode('code-abc')).rejects.toThrow(
      'exchange endpoint unreachable (Network request failed)',
    )
  })
})
