const STRAVA_ZONES_URL = 'https://www.strava.com/api/v3/athlete/zones'

export type StravaZonesFetchResult =
  | { status: 'ok'; zones: unknown }
  | { status: 'unauthorized' }
  | { status: 'rateLimited' }
  | { status: 'error'; error: unknown }

/**
 * Reads the athlete's heart-rate and power zones.
 *
 * Needs `profile:read_all`, which the OAuth flow already requests. The payload
 * is returned raw — turning it into an FTP is the estimator's job, which keeps
 * that inference testable without a network.
 */
export async function fetchStravaZones(
  accessToken: string,
  fetchImpl: typeof fetch = fetch,
): Promise<StravaZonesFetchResult> {
  let response: Response

  try {
    response = await fetchImpl(STRAVA_ZONES_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (error) {
    return {
      status: 'error',
      error: new Error(
        `Strava unreachable (${error instanceof Error ? error.message : 'unknown'})`,
      ),
    }
  }

  // 403 as well as 401: Strava returns it when the token exists but lacks the
  // scope this endpoint needs, and the remedy is the same — authorize again.
  if (response.status === 401 || response.status === 403) {
    return { status: 'unauthorized' }
  }

  if (response.status === 429) {
    return { status: 'rateLimited' }
  }

  if (!response.ok) {
    return { status: 'error', error: new Error(`Strava returned ${response.status}`) }
  }

  return { status: 'ok', zones: await response.json() }
}
