import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchRecentActivities } from './strava-activity.service'

const mocks = vi.hoisted(() => ({ epoch: 0, session: vi.fn(), fetch: vi.fn() }))
vi.mock('./strava-session', () => ({ getValidAccessToken: mocks.session }))
vi.mock('../oauth/strava-token.persistence', () => ({ getStravaTokenEpoch: () => mocks.epoch }))
vi.mock('./strava-activity.api', () => ({ fetchStravaActivities: mocks.fetch }))
const now = new Date('2026-09-17T16:00:00.000Z')
function ride(id: number) {
  return {
    id,
    sport_type: 'Ride',
    start_date: '2026-09-17T12:00:00Z',
    moving_time: 3600,
    distance: 25000,
    total_elevation_gain: 200,
  }
}
function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('not_initialized')
  }
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.epoch = 0
  mocks.session.mockImplementation(async () => ({
    status: 'ready',
    accessToken: `access-${mocks.epoch}`,
    sessionEpoch: mocks.epoch,
  }))
  mocks.fetch.mockResolvedValue({ status: 'ok', activities: [ride(1)] })
})

describe('Strava requests scoped to credentials and history window', () => {
  it('shares concurrent requests only within the same session and time window', async () => {
    const results = await Promise.all([
      fetchRecentActivities({ now }),
      fetchRecentActivities({ now }),
      fetchRecentActivities({ now }),
    ])
    expect(mocks.fetch).toHaveBeenCalledTimes(1)
    expect(results.every((result) => result.status === 'ready')).toBe(true)
    expect(results[0]).toEqual(results[1])
  })
  it('does not serve a previous cyclist’s request to a new session', async () => {
    const started = deferred<void>()
    const previous = deferred<{ status: 'ok'; activities: ReturnType<typeof ride>[] }>()
    mocks.fetch.mockImplementationOnce(() => {
      started.resolve()
      return previous.promise
    })
    const oldRequest = fetchRecentActivities({ now })
    await started.promise
    mocks.epoch = 1
    mocks.fetch.mockResolvedValueOnce({ status: 'ok', activities: [ride(2)] })
    const current = await fetchRecentActivities({ now })
    previous.resolve({ status: 'ok', activities: [ride(1)] })
    expect(await oldRequest).toEqual({ status: 'disconnected' })
    expect(current.status === 'ready' && current.activities[0].id).toBe('strava-2')
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
  })
  it('rejects a token returned across a concurrent generation change', async () => {
    mocks.session.mockImplementationOnce(async () => {
      mocks.epoch = 1
      return { status: 'ready', accessToken: 'old-access', sessionEpoch: 0 }
    })
    expect(await fetchRecentActivities({ now })).toEqual({ status: 'disconnected' })
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
  it('does not share a request with a different history boundary', async () => {
    await Promise.all([
      fetchRecentActivities({ now }),
      fetchRecentActivities({ now: new Date(now.getTime() + 1000) }),
    ])
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
  })
  it('refetches completed requests instead of retaining an API-data cache', async () => {
    await fetchRecentActivities({ now })
    await fetchRecentActivities({ now })
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
  })
  it('allows retry after a transient API error', async () => {
    mocks.fetch.mockResolvedValueOnce({ status: 'error', error: new Error('offline') })
    expect((await fetchRecentActivities({ now })).status).toBe('error')
    expect((await fetchRecentActivities({ now })).status).toBe('ready')
    expect(mocks.fetch).toHaveBeenCalledTimes(2)
  })
})
