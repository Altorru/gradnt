/**
 * The scopes Strava documents.
 *
 * - read: read all activities.
 * - read_all: read everything, including routes, segments and private events.
 * - profile:read_all: read the athlete's full profile and training zones.
 * - profile:write: update the athlete's profile.
 * - activity:read: read the rider's activities.
 * - activity:read_all: read every activity, not only the recent subset.
 * - activity:write: create and update activities.
 */
export type StravaScope =
  | 'read'
  | 'read_all'
  | 'profile:read_all'
  | 'profile:write'
  | 'activity:read'
  | 'activity:read_all'
  | 'activity:write'

const STRAVA_SCOPES: readonly StravaScope[] = [
  'read',
  'read_all',
  'profile:read_all',
  'profile:write',
  'activity:read',
  'activity:read_all',
  'activity:write',
]

export function isStravaScope(value: string): value is StravaScope {
  return (STRAVA_SCOPES as readonly string[]).includes(value)
}

/**
 * Scopes GRADNT requests during the OAuth flow.
 *
 * - profile:read_all: athlete profile, training zones and FTP.
 * - activity:read_all: every activity, not only the rider's recent subset.
 *
 * read_all is intentionally not requested: GRADNT does not need routes,
 * segments or private events for this feature.
 */
export const requiredScopes: readonly StravaScope[] = ['profile:read_all', 'activity:read_all']
