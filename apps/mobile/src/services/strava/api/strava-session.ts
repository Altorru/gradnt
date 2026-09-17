import { readStravaRefreshUrl } from '../oauth/strava-config'
import {
  getStravaTokenEpoch,
  replaceStravaTokens,
  loadStravaTokens,
  type StravaTokens,
} from '../oauth/strava-token.persistence'

/**
 * Refresh this long before the token actually expires, so a request is never
 * sent with a token that dies in flight.
 */
const EXPIRY_SKEW_MS = 5 * 60 * 1000

export type StravaSessionResult =
  | { status: 'ready'; accessToken: string; sessionEpoch: number }
  | { status: 'disconnected' }
  | { status: 'expired' }
  | { status: 'error'; error: unknown }

/**
 * Refreshes in flight, shared only by callers from the same credential generation.
 *
 * Strava rotates the refresh token on each call, so two concurrent refreshes
 * would spend the same token twice: the second would be rejected and the rider
 * would have to authorize again. One promise per generation, awaited by its callers.
 *
 * Cleared in `finally` rather than on success only — a rejection that left this
 * set would hang every later request until the app was relaunched.
 */
const refreshInFlight = new Map<number, Promise<StravaSessionResult>>()

/**
 * Returns an access token that is valid now, refreshing it first when needed.
 *
 * The four outcomes are kept distinct on purpose: a surface that offers to
 * reconnect must not appear for a transient network failure, and a dead refresh
 * token must not look retryable.
 */
export async function getValidAccessToken(): Promise<StravaSessionResult> {
  const epoch = getStravaTokenEpoch()
  const tokens = await loadStravaTokens()
  if (getStravaTokenEpoch() !== epoch) return { status: 'disconnected' }

  if (tokens === null) {
    return { status: 'disconnected' }
  }

  if (Date.parse(tokens.expiresAt) - EXPIRY_SKEW_MS > Date.now()) {
    return { status: 'ready', accessToken: tokens.accessToken, sessionEpoch: epoch }
  }

  const existing = refreshInFlight.get(epoch)
  if (existing) return existing
  const request = performRefresh(tokens, epoch).finally(() => refreshInFlight.delete(epoch))
  refreshInFlight.set(epoch, request)
  return request
}

async function performRefresh(current: StravaTokens, epoch: number): Promise<StravaSessionResult> {
  const refreshUrl = readStravaRefreshUrl()

  if (refreshUrl === null) {
    return { status: 'error', error: new Error('Strava refresh endpoint is not configured') }
  }

  let response: Response

  try {
    response = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    })
  } catch (error) {
    // Labelled, because an unreachable refresh endpoint and an unreachable
    // Strava API are different failures that used to read identically.
    return {
      status: 'error',
      error: new Error(
        `Refresh endpoint unreachable (${error instanceof Error ? error.message : 'unknown'})`,
      ),
    }
  }

  // The refresh token is dead — revoked, or already spent by a refresh whose
  // response was lost. Nothing short of authorizing again recovers it, so the
  // stored tokens go and the rider is asked to reconnect.
  if (response.status === 401) {
    if (!(await replaceStravaTokens(epoch, null))) return { status: 'disconnected' }
    return { status: 'expired' }
  }

  if (!response.ok) {
    return { status: 'error', error: new Error(`Refresh endpoint returned ${response.status}`) }
  }

  const parsed = parseRefreshResponse(await response.json())

  if (parsed === null) {
    return { status: 'error', error: new Error('Refresh endpoint returned an unexpected payload') }
  }

  // Persisted before the token is handed out: Strava has already spent the old
  // refresh token, so losing this write would end the session.
  if (!(await replaceStravaTokens(epoch, parsed))) return { status: 'disconnected' }

  return { status: 'ready', accessToken: parsed.accessToken, sessionEpoch: epoch + 1 }
}

function parseRefreshResponse(payload: unknown): StravaTokens | null {
  const tokens = (payload as { tokens?: unknown } | null)?.tokens

  if (typeof tokens !== 'object' || tokens === null) {
    return null
  }

  const { accessToken, refreshToken, expiresAt } = tokens as Record<string, unknown>

  if (
    typeof accessToken !== 'string' ||
    accessToken === '' ||
    typeof refreshToken !== 'string' ||
    refreshToken === '' ||
    typeof expiresAt !== 'string'
  ) {
    return null
  }

  return { accessToken, refreshToken, expiresAt }
}
