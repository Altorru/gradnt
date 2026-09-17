import { describe, expect, it } from 'vitest'

import type { Activity } from '@/lib/domain'
import { getAfterRideActivity } from './after-ride'

const now = new Date('2026-09-17T16:00:00Z')
function ride(id: string, startAt: string, durationSeconds = 3600): Activity {
  return {
    id,
    startAt,
    durationSeconds,
    source: 'strava',
    externalId: id,
    sportType: 'road',
    distanceMeters: 20000,
    elevationGainMeters: 200,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePower: null,
    normalizedPower: null,
    weightedPower: null,
    calories: null,
    provenance: 'observed',
  }
}
describe('a single useful after-ride prompt', () => {
  it('does not prompt for an empty history', () => {
    expect(getAfterRideActivity([], now)).toBeNull()
  })
  it('selects the newest finished ride without reordering its source', () => {
    const older = ride('strava-1', '2026-09-16T12:00:00Z')
    const latest = ride('strava-2', '2026-09-17T12:00:00Z')
    const source = [older, latest]
    expect(getAfterRideActivity(source, now)).toBe(latest)
    expect(source).toEqual([older, latest])
  })
  it('does not treat an old backfill as a new ride', () => {
    expect(getAfterRideActivity([ride('strava-1', '2026-09-15T15:59:59Z')], now)).toBeNull()
  })
  it('does not prompt for future, unfinished or zero-duration rides', () => {
    const future = ride('strava-1', '2026-09-17T17:00:00Z')
    const unfinished = ride('strava-2', '2026-09-17T15:30:00Z')
    const zero = ride('strava-3', '2026-09-17T12:00:00Z', 0)
    expect(getAfterRideActivity([future, unfinished, zero], now)).toBeNull()
  })
  it('includes the exact 48-hour boundary and a ride finishing now', () => {
    const boundary = ride('strava-1', '2026-09-15T16:00:00Z')
    const finished = ride('strava-2', '2026-09-17T15:00:00Z')
    expect(getAfterRideActivity([boundary], now)).toBe(boundary)
    expect(getAfterRideActivity([finished], now)).toBe(finished)
  })
})
