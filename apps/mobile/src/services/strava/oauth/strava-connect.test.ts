import { beforeEach, describe, expect, it, vi } from 'vitest'

import { beginStravaConnect, completeStravaConnect } from './strava-connect'
import { clearPendingStravaState, savePendingStravaState } from './strava-token.persistence'
import type { StravaTokenBroker } from './strava-token-broker'
import { requiredScopes } from './strava-scopes'

vi.mock('expo-crypto', () => ({ randomUUID: () => 'generated-state' }))
vi.mock('expo-web-browser', () => ({ openAuthSessionAsync: vi.fn() }))

// In-memory stand-in so the pending state round-trips across the two phases.
vi.mock('./strava-token.persistence', () => {
  let pending: string | null = null

  return {
    savePendingStravaState: vi.fn(async (state: string) => {
      pending = state
    }),
    takePendingStravaState: vi.fn(async () => {
      const state = pending
      pending = null
      return state
    }),
    clearPendingStravaState: vi.fn(async () => {
      pending = null
    }),
  }
})

/** Custom scheme the OS hands back to the app. */
const APP_CALLBACK = 'gradnt://strava/callback'

/** https endpoint Strava redirects to, which then bridges to APP_CALLBACK. */
const BRIDGE_URL = 'https://project.supabase.co/functions/v1/strava-exchange'

const config = {
  clientId: 'client-123',
  redirectUri: BRIDGE_URL,
  authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
  scopes: requiredScopes,
}

const successCallbackUrl = `${APP_CALLBACK}?code=code-abc&state=generated-state&scope=profile:read_all%20activity:read_all`

function stubOpenAuthSession(result: { type: string; url?: string }) {
  return vi.fn(async (_url: string, _redirectUrl: string) => result)
}

function fakeBroker(): StravaTokenBroker {
  return {
    exchangeCode: vi.fn(async () => ({
      athleteId: 'athlete-123',
      displayName: 'Rider One',
      grantedScopes: requiredScopes,
    })),
  }
}

function options(broker: StravaTokenBroker) {
  return { config, callbackUri: APP_CALLBACK, broker }
}

beforeEach(async () => {
  await clearPendingStravaState()
})

describe('beginStravaConnect', () => {
  it('sends Strava the bridge URL but waits for the app scheme', async () => {
    const openAuthSession = stubOpenAuthSession({ type: 'cancel' })

    await beginStravaConnect(options(fakeBroker()), { openAuthSession })

    const [authUrl, redirectUrl] = openAuthSession.mock.calls[0]

    // The browser must intercept the custom scheme, not the bridge.
    expect(redirectUrl).toBe(APP_CALLBACK)

    const params = new URL(authUrl).searchParams
    // Strava must be told the https URL: its settings only accept a domain.
    expect(params.get('redirect_uri')).toBe(BRIDGE_URL)
    expect(params.get('state')).toBe('generated-state')
    expect(params.get('client_id')).toBe('client-123')
    expect(params.get('scope')).toBe('profile:read_all activity:read_all')
  })

  it('reports a cancelled session when the rider dismisses the browser', async () => {
    const broker = fakeBroker()
    const openAuthSession = stubOpenAuthSession({ type: 'cancel' })

    const outcome = await beginStravaConnect(options(broker), { openAuthSession })

    expect(outcome).toEqual({ status: 'cancelled' })
    expect(broker.exchangeCode).not.toHaveBeenCalled()
  })

  it('connects when the session itself resolves with the callback url', async () => {
    const broker = fakeBroker()
    const openAuthSession = stubOpenAuthSession({ type: 'success', url: successCallbackUrl })

    const outcome = await beginStravaConnect(options(broker), { openAuthSession })

    expect(outcome).toEqual({
      status: 'connected',
      connection: {
        athleteId: 'athlete-123',
        displayName: 'Rider One',
        grantedScopes: requiredScopes,
      },
    })
    expect(broker.exchangeCode).toHaveBeenCalledWith('code-abc')
  })

  it('leaves the attempt pending when dismissed, so the deep link can finish it', async () => {
    const broker = fakeBroker()
    // Switching to the app to deliver the deep link can dismiss this session,
    // which must not abandon the attempt.
    const openAuthSession = stubOpenAuthSession({ type: 'dismiss' })

    const begun = await beginStravaConnect(options(broker), { openAuthSession })
    expect(begun).toEqual({ status: 'cancelled' })

    const finished = await completeStravaConnect(successCallbackUrl, broker)

    expect(finished.status).toBe('connected')
    expect(broker.exchangeCode).toHaveBeenCalledTimes(1)
  })
})

describe('completeStravaConnect', () => {
  async function withPendingAttempt() {
    await savePendingStravaState('generated-state')
  }

  it('connects from a callback URL delivered as a deep link', async () => {
    const broker = fakeBroker()
    await withPendingAttempt()

    const outcome = await completeStravaConnect(successCallbackUrl, broker)

    expect(outcome).toEqual({
      status: 'connected',
      connection: {
        athleteId: 'athlete-123',
        displayName: 'Rider One',
        grantedScopes: requiredScopes,
      },
    })
    expect(broker.exchangeCode).toHaveBeenCalledWith('code-abc')
  })

  it('consumes the attempt once, so a duplicate delivery is ignored', async () => {
    const broker = fakeBroker()
    await withPendingAttempt()

    const first = await completeStravaConnect(successCallbackUrl, broker)
    const second = await completeStravaConnect(successCallbackUrl, broker)

    expect(first.status).toBe('connected')
    expect(second).toEqual({ status: 'ignored' })
    // A code is single use: it must never be exchanged twice.
    expect(broker.exchangeCode).toHaveBeenCalledTimes(1)
  })

  it('is ignored when no attempt is in flight', async () => {
    const broker = fakeBroker()

    await expect(completeStravaConnect(successCallbackUrl, broker)).resolves.toEqual({
      status: 'ignored',
    })
    expect(broker.exchangeCode).not.toHaveBeenCalled()
  })

  it('rejects a callback whose state does not match, without exchanging', async () => {
    const broker = fakeBroker()
    await withPendingAttempt()

    const outcome = await completeStravaConnect(
      `${APP_CALLBACK}?code=code-abc&state=other-state&scope=profile:read_all%20activity:read_all`,
      broker,
    )

    expect(outcome).toEqual({ status: 'rejected', callback: { status: 'invalidState' } })
    expect(broker.exchangeCode).not.toHaveBeenCalled()
  })

  it('rejects a denied authorization, without exchanging', async () => {
    const broker = fakeBroker()
    await withPendingAttempt()

    const outcome = await completeStravaConnect(
      `${APP_CALLBACK}?error=access_denied&state=generated-state`,
      broker,
    )

    expect(outcome).toEqual({
      status: 'rejected',
      callback: { status: 'userDenied', errorDescription: undefined },
    })
    expect(broker.exchangeCode).not.toHaveBeenCalled()
  })

  it('surfaces a broker failure as an error outcome rather than throwing', async () => {
    const broker: StravaTokenBroker = {
      exchangeCode: async () => {
        throw new Error('exchange endpoint returned 502')
      },
    }
    await withPendingAttempt()

    const outcome = await completeStravaConnect(successCallbackUrl, broker)

    expect(outcome.status).toBe('error')
  })

  it('surfaces an unparseable callback URL as an error outcome rather than crashing', async () => {
    const broker = fakeBroker()
    await withPendingAttempt()

    const outcome = await completeStravaConnect('not a url at all', broker)

    expect(outcome.status).toBe('error')
    expect(broker.exchangeCode).not.toHaveBeenCalled()
  })
})
