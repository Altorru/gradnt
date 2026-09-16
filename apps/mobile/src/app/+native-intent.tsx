import { stashStravaCallbackUrl, toCallbackUrl } from '@/services/strava/oauth/strava-callback-url'

/**
 * Incoming native deep links are rewritten here before expo-router routes them.
 *
 * The Strava bridge redirects to `gradnt://strava/callback?...`. That has host
 * `strava` and path `callback`, which matches no route, so expo-router rendered
 * its "Unmatched Route" screen instead of returning to the app. Rewriting to
 * `/strava-callback` gives the callback somewhere to land.
 *
 * The query is stashed rather than passed as route params, so the handler works
 * from the original bytes instead of a decoded and re-encoded copy.
 *
 * Native only; web deep links never reach this.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  if (path.includes('strava/callback')) {
    stashStravaCallbackUrl(toCallbackUrl(path))
    return '/strava-callback'
  }

  return path
}
