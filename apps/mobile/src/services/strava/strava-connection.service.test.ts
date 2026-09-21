import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deleteServerStravaConnection,
  reconcileStoredStravaConnection,
  reconcileStravaConnection,
} from './strava-connection.service'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  loadTokens: vi.fn(),
  saveTokens: vi.fn(),
  clearTokens: vi.fn(),
  setState: vi.fn(),
  state: { hydrated: true, completed: true, cloud: { userId: 'user-1' }, strava: null as unknown },
}))

vi.mock('@/services/supabase/client', () => ({
  getSupabaseClient: () => ({ auth: { getSession: mocks.getSession } }),
}))
vi.mock('./oauth/strava-token.persistence', () => ({
  loadStravaTokens: mocks.loadTokens,
  saveStravaTokens: mocks.saveTokens,
  clearStravaTokens: mocks.clearTokens,
}))
vi.mock('@/features/onboarding/store/onboarding.store', () => ({
  useOnboardingStore: { getState: () => mocks.state, setState: mocks.setState },
}))

const localTokens = {
  accessToken: 'local-access',
  refreshToken: 'local-refresh',
  expiresAt: '2026-10-01T00:00:00.000Z',
}
const serverTokens = {
  accessToken: 'server-access',
  refreshToken: 'server-refresh',
  expiresAt: '2026-10-02T00:00:00.000Z',
}

function responses(...payloads: unknown[]) {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => ({
    ok: true,
    json: async () => payloads.shift(),
  }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('Strava account connection', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test')
    mocks.getSession
      .mockReset()
      .mockResolvedValue({ data: { session: { access_token: 'user-jwt' } } })
    mocks.loadTokens.mockReset().mockResolvedValue(localTokens)
    mocks.saveTokens.mockReset().mockResolvedValue(undefined)
    mocks.clearTokens.mockReset().mockResolvedValue(undefined)
    mocks.setState.mockReset()
    mocks.state.strava = null
  })

  it('verifies and transfers a pre-account device grant', async () => {
    const fetchMock = responses(
      { connected: false, revoked: false },
      { connected: true, athleteId: '123', displayName: 'Rider', tokens: localTokens },
    )

    expect(await reconcileStravaConnection()).toEqual({ status: 'connected', athleteName: 'Rider' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [, post] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(post.method).toBe('POST')
    expect(post.headers).toMatchObject({ Authorization: 'Bearer user-jwt' })
    expect(JSON.parse(post.body as string)).toEqual(localTokens)
  })

  it('uses an existing account connection over stale device credentials', async () => {
    const fetchMock = responses({
      connected: true,
      athleteId: '456',
      displayName: 'Account Rider',
      tokens: serverTokens,
    })
    expect(await reconcileStravaConnection()).toEqual({
      status: 'connected',
      athleteName: 'Account Rider',
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(mocks.saveTokens).toHaveBeenCalledWith(serverTokens)
  })

  it('does not relink a revoked grant from the device', async () => {
    const fetchMock = responses({ connected: false, revoked: true })
    expect(await reconcileStravaConnection()).toEqual({
      status: 'not_connected',
      athleteName: null,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(mocks.clearTokens).toHaveBeenCalledTimes(1)
  })

  it('updates the account badge only after server verification', async () => {
    responses({
      connected: true,
      athleteId: '456',
      displayName: 'Account Rider',
      tokens: serverTokens,
    })
    await reconcileStoredStravaConnection()
    expect(mocks.setState).toHaveBeenCalledWith({
      strava: { status: 'connected', athleteName: 'Account Rider' },
    })
  })

  it('removes the server link on disconnect', async () => {
    const fetchMock = responses({ connected: false })
    await deleteServerStravaConnection()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].method).toBe('DELETE')
  })
})
