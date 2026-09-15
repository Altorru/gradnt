import { stravaAppCallbackUri } from './strava-config'

/**
 * Rebuilds the callback URL from the raw incoming deep link.
 *
 * Only the query is taken from the link and re-based on the app's known
 * callback URI, so the result parses regardless of whether expo-router hands
 * over a full `mobile://strava/callback?…` URL or just a path. It also avoids
 * round-tripping `code` and `state` through route-param decoding and
 * re-encoding, which is where a mismatch would surface as a bogus
 * `invalidState`.
 */
export function toCallbackUrl(rawLink: string): string {
  const queryIndex = rawLink.indexOf('?')
  const query = queryIndex === -1 ? '' : rawLink.slice(queryIndex)

  return `${stravaAppCallbackUri}${query}`
}

/**
 * The callback URL that arrived as a deep link.
 *
 * `+native-intent.tsx` stashes it while rewriting the link and the callback
 * route picks it up, so the handler works from the original bytes rather than
 * from a re-derived copy.
 */
let pendingCallbackUrl: string | null = null

export function stashStravaCallbackUrl(url: string): void {
  pendingCallbackUrl = url
}

export function takeStravaCallbackUrl(): string | null {
  const url = pendingCallbackUrl
  pendingCallbackUrl = null
  return url
}
