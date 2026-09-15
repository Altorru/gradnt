import * as Crypto from 'expo-crypto'
import * as WebBrowser from 'expo-web-browser'

import { handleCallback, type StravaCallbackResult } from './strava-callback'
import { buildAuthorizationUrl, type StravaAuthConfig } from './strava-config'
import { savePendingStravaState, takePendingStravaState } from './strava-token.persistence'
import { connectStrava, type StravaConnection, type StravaTokenBroker } from './strava-token-broker'

/**
 * Everything the UI needs to know about one connection attempt.
 *
 * `rejected` keeps the full callback result so the caller can distinguish a
 * user cancel from a scope problem without re-deriving it from an error.
 * `ignored` means no attempt was in flight — a duplicate callback delivery.
 */
export type StravaConnectOutcome =
  | { status: 'connected'; connection: StravaConnection }
  | { status: 'cancelled' }
  | { status: 'rejected'; callback: StravaCallbackResult }
  | { status: 'error'; error: unknown }
  | { status: 'ignored' }

/**
 * Opens the authorization page and reports how the session ended. Narrowed to
 * the shape this module consumes so tests can inject a fake.
 */
export type AuthSessionOpener = (
  url: string,
  redirectUrl: string,
) => Promise<{ type: string; url?: string | null }>

export interface StravaConnectOptions {
  config: Omit<StravaAuthConfig, 'stateGenerator'>
  /**
   * Custom scheme the browser must intercept. Distinct from
   * `config.redirectUri`, which is the https bridge Strava redirects to.
   */
  callbackUri: string
  broker: StravaTokenBroker
}

export interface StravaConnectDeps {
  openAuthSession?: AuthSessionOpener
  stateGenerator?: () => string
}

/**
 * Starts the redirect flow: records the state, then opens the authorization page.
 *
 * The callback can come back two ways — as this session's resolved url, or as a
 * deep link that expo-router delivers to the callback route. Both funnel into
 * `completeStravaConnect`, which consumes the pending state, so the exchange
 * runs once whichever path arrives first.
 */
export async function beginStravaConnect(
  options: StravaConnectOptions,
  deps: StravaConnectDeps = {},
): Promise<StravaConnectOutcome> {
  const state = (deps.stateGenerator ?? generateState)()
  await savePendingStravaState(state)

  const authUrl = buildAuthorizationUrl({ ...options.config, stateGenerator: () => state })

  const openAuthSession =
    deps.openAuthSession ??
    ((url: string, redirectUrl: string) => WebBrowser.openAuthSessionAsync(url, redirectUrl))

  const session = await openAuthSession(authUrl, options.callbackUri)

  // Only a dismissal can be concluded from here: on success the callback may
  // instead be delivered as a deep link, which the callback route completes.
  //
  // The pending state is deliberately left in place. Switching to the app to
  // deliver that deep link can itself dismiss this session, so treating a
  // dismissal as "abandon the attempt" would break the very path that finishes
  // it. A later attempt overwrites the state, so a stale one is harmless.
  if (session.type !== 'success' || typeof session.url !== 'string') {
    return { status: 'cancelled' }
  }

  return completeStravaConnect(session.url, options.broker)
}

/**
 * Finishes the flow from a callback URL.
 *
 * Safe to call twice for the same attempt: the pending state is consumed on
 * first call, and a second call reports `ignored` instead of replaying a
 * single-use authorization code.
 */
export async function completeStravaConnect(
  callbackUrl: string,
  broker: StravaTokenBroker,
): Promise<StravaConnectOutcome> {
  const expectedState = await takePendingStravaState()

  if (expectedState === null) {
    return { status: 'ignored' }
  }

  let callback: StravaCallbackResult

  try {
    callback = handleCallback(callbackUrl, expectedState)
  } catch (error) {
    return { status: 'error', error }
  }

  if (callback.status !== 'success') {
    return { status: 'rejected', callback }
  }

  try {
    return { status: 'connected', connection: await connectStrava(callback, broker) }
  } catch (error) {
    return { status: 'error', error }
  }
}

/**
 * Cryptographically random CSRF token. `Math.random` would be predictable and
 * would weaken the state check to a formality.
 */
function generateState(): string {
  return Crypto.randomUUID()
}
