import type { StravaScope } from './strava-scopes'
import type { StravaCallbackResult } from './strava-callback'

/**
 * The successful variant of the callback result, derived from the full union
 * so the success shape is never duplicated.
 */
export type StravaCallbackSuccess = Extract<StravaCallbackResult, { readonly status: 'success' }>

/**
 * Minimal normalized connection result exposed to the mobile app.
 *
 * Deliberately decoupled from raw Strava responses. It never carries an
 * access token, refresh token or client secret: those live in the backend
 * TokenBroker, not on the device.
 */
export interface StravaConnection {
  readonly athleteId: string
  readonly displayName?: string
  readonly grantedScopes: readonly StravaScope[]
}

/**
 * Secure contract for the future backend TokenBroker.
 *
 * The mobile app injects this broker and hands it a validated authorization
 * code. The backend performs the `POST /oauth/token` exchange, owns the
 * client_secret, stores and rotates the refresh token, and returns only a
 * normalized connection. The mobile never calls Strava's token endpoint.
 */
export interface StravaTokenBroker {
  exchangeCode(code: string): Promise<StravaConnection>
}

/**
 * Pure orchestration step of the OAuth flow.
 *
 * Accepts any callback result and enforces the success contract at runtime,
 * so a non-success result (or a missing authorization code) can never reach
 * the token exchange, even when the type narrowing is bypassed. It stays free
 * of any secret or token.
 */
export function connectStrava(
  callbackResult: StravaCallbackResult,
  broker: StravaTokenBroker,
): Promise<StravaConnection> {
  if (callbackResult.status !== 'success') {
    return Promise.reject(
      new Error(
        `Cannot connect to Strava: callback result has status '${callbackResult.status}', not 'success'`,
      ),
    )
  }

  if (typeof callbackResult.code !== 'string' || callbackResult.code === '') {
    return Promise.reject(
      new Error('Cannot connect to Strava: callback result has no authorization code'),
    )
  }

  return broker.exchangeCode(callbackResult.code)
}
