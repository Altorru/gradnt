import { activitySchema, provenanceForSource, type Activity } from '@/lib/domain'

import { stravaActivitySchema, type StravaActivity } from './strava-activity.schema'

/**
 * Strava sport types that GRADNT understands.
 *
 * Anything absent — running, swimming, walking, and the electric assist
 * variants — is not a ride this app can reason about, so it is dropped rather
 * than coerced into a category it does not belong to. An e-bike ride in
 * particular would distort power and training-load figures.
 */
const SPORT_TYPES: Record<string, Activity['sportType']> = {
  Ride: 'road',
  GravelRide: 'gravel',
  MountainBikeRide: 'mtb',
  VirtualRide: 'indoor_cycling',
}

/**
 * Turns one raw Strava activity into the GRADNT domain model, or null when it
 * is not a ride we can use.
 *
 * Never throws: an activity that fails validation is dropped on its own rather
 * than taking a whole page with it.
 */
export function normalizeStravaActivity(raw: unknown): Activity | null {
  const parsed = stravaActivitySchema.safeParse(raw)

  if (!parsed.success) {
    return null
  }

  const strava = parsed.data
  const sportType = SPORT_TYPES[strava.sport_type ?? strava.type ?? '']

  if (sportType === undefined) {
    return null
  }

  const candidate = {
    id: `strava-${String(strava.id)}`,
    source: 'strava' as const,
    externalId: String(strava.id),
    sportType,
    startAt: toIsoString(strava.start_date),
    durationSeconds: Math.round(strava.moving_time),
    distanceMeters: strava.distance,
    elevationGainMeters: strava.total_elevation_gain,
    // A dropped sensor reports 0. Storing that as a real zero would drag down
    // every average computed downstream, so it is treated as missing.
    averageHeartRate: positiveOrNull(strava.average_heartrate),
    maxHeartRate: positiveOrNull(strava.max_heartrate),
    averagePower: positiveOrNull(strava.average_watts),
    // Strava's weighted average power is its own approximation of normalised
    // power, not the real thing. It is kept under its own name so nothing
    // downstream treats it as measured NP.
    normalizedPower: null,
    weightedPower: positiveOrNull(strava.weighted_average_watts),
    // Kilojoules from a power meter are the standard stand-in for kilocalories
    // on a bike, where roughly a quarter of the energy is actually delivered.
    calories: strava.kilojoules == null ? null : Math.round(strava.kilojoules),
    provenance: 'observed' as const,
    provenanceDetails: provenanceForSource('strava'),
  }

  const validated = activitySchema.safeParse(candidate)

  return validated.success ? validated.data : null
}

function positiveOrNull(value: number | null | undefined): number | null {
  return value == null || value <= 0 ? null : value
}

function toIsoString(value: string): string {
  const timestamp = Date.parse(value)

  return Number.isNaN(timestamp) ? value : new Date(timestamp).toISOString()
}

export { stravaActivitySchema, type StravaActivity }
