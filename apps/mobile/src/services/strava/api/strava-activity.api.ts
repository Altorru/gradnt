const STRAVA_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities'

/**
 * Strava's maximum for this endpoint. Larger means fewer round trips against a
 * quota shared by every user of the application.
 */
const PER_PAGE = 200

/**
 * Stops paginating if Strava keeps returning full pages, so a misbehaving
 * response cannot spin forever against the quota.
 */
const MAX_PAGES = 10

export type StravaActivitiesFetchResult =
  | { status: 'ok'; activities: unknown[] }
  | { status: 'unauthorized' }
  | { status: 'rateLimited' }
  | { status: 'error'; error: unknown }

/**
 * Fetches the rider's activities since the given date.
 *
 * Returns raw payloads: turning them into the domain model is the normalizer's
 * job, and keeping the two apart is what lets the mapping be tested without a
 * network.
 */
export async function fetchStravaActivities(
  accessToken: string,
  sinceEpochSeconds: number,
  fetchImpl: typeof fetch = fetch,
): Promise<StravaActivitiesFetchResult> {
  const collected: unknown[] = []

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const url = new URL(STRAVA_ACTIVITIES_URL)
    url.searchParams.set('after', String(sinceEpochSeconds))
    url.searchParams.set('page', String(page))
    url.searchParams.set('per_page', String(PER_PAGE))

    let response: Response

    try {
      response = await fetchImpl(url.toString(), {
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

    // 403 is not a transient failure on this endpoint: Strava returns it when
    // the token exists but does not carry the scopes the call needs. Both
    // answers have the same remedy — authorize again — so they share a state
    // rather than being reported as a generic error.
    if (response.status === 401 || response.status === 403) {
      return { status: 'unauthorized' }
    }

    // Distinct from any other failure: the quota is per application, so a
    // limited rider means every rider is limited, and the app must say so
    // rather than suggest reconnecting.
    if (response.status === 429) {
      return { status: 'rateLimited' }
    }

    if (!response.ok) {
      return { status: 'error', error: new Error(`Strava returned ${response.status}`) }
    }

    const page_ = await response.json()

    if (!Array.isArray(page_)) {
      return { status: 'error', error: new Error('Strava returned an unexpected payload') }
    }

    collected.push(...page_)

    // A short page is the last one.
    if (page_.length < PER_PAGE) {
      break
    }
  }

  return { status: 'ok', activities: collected }
}
