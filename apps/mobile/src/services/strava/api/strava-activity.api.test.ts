import { describe, expect, it, vi } from 'vitest'

import { fetchStravaActivities } from './strava-activity.api'

const SINCE = 1_700_000_000

function page(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: index }))
}

function stubFetch(pages: unknown[][], status = 200) {
  let call = 0
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => {
    const body = pages[Math.min(call, pages.length - 1)]
    call += 1

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    }
  })
  return fetchMock
}

describe('fetchStravaActivities', () => {
  it('sends the bearer token and the expected query', async () => {
    const fetchMock = stubFetch([page(2)])

    await fetchStravaActivities('access-token', SINCE, fetchMock as unknown as typeof fetch)

    const [url, init] = fetchMock.mock.calls[0]!
    const parsed = new URL(url)

    expect(parsed.origin + parsed.pathname).toBe('https://www.strava.com/api/v3/athlete/activities')
    expect(parsed.searchParams.get('after')).toBe(String(SINCE))
    expect(parsed.searchParams.get('per_page')).toBe('200')
    expect(parsed.searchParams.get('page')).toBe('1')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer access-token')
  })

  it('stops at the first short page', async () => {
    const fetchMock = stubFetch([page(200), page(3)])

    const result = await fetchStravaActivities(
      'access-token',
      SINCE,
      fetchMock as unknown as typeof fetch,
    )

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(result).toMatchObject({ status: 'ok' })
    expect(result.status === 'ok' && result.activities).toHaveLength(203)
  })

  it('does not ask for another page when the first one is short', async () => {
    const fetchMock = stubFetch([page(4)])

    await fetchStravaActivities('access-token', SINCE, fetchMock as unknown as typeof fetch)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports an unauthorized token distinctly', async () => {
    const fetchMock = stubFetch([[]], 401)

    await expect(
      fetchStravaActivities('access-token', SINCE, fetchMock as unknown as typeof fetch),
    ).resolves.toEqual({ status: 'unauthorized' })
  })

  it('reports rate limiting distinctly, since the quota is shared', async () => {
    const fetchMock = stubFetch([[]], 429)

    await expect(
      fetchStravaActivities('access-token', SINCE, fetchMock as unknown as typeof fetch),
    ).resolves.toEqual({ status: 'rateLimited' })
  })

  it('treats a non-array payload as an error rather than an empty history', async () => {
    const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
      ok: true,
      status: 200,
      json: async () => ({ message: 'oops' }),
    }))

    await expect(
      fetchStravaActivities('access-token', SINCE, fetchMock as unknown as typeof fetch),
    ).resolves.toMatchObject({ status: 'error' })
  })

  it('surfaces a network failure as an error', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('Network request failed')
    })

    await expect(
      fetchStravaActivities('access-token', SINCE, fetchMock as unknown as typeof fetch),
    ).resolves.toMatchObject({ status: 'error' })
  })
})
