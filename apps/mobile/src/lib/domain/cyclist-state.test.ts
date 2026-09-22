import { describe, expect, it } from 'vitest'

import type { Activity } from './schemas'
import { getCyclistState } from './cyclist-state'

const now = new Date('2026-09-22T12:00:00.000Z')

function ride(daysAgo: number, options: Partial<Activity> = {}): Activity {
  return {
    id: `ride-${daysAgo}-${options.averagePower ?? 'none'}`,
    source: 'strava',
    externalId: null,
    sportType: 'road',
    startAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 60 * 60,
    distanceMeters: 30_000,
    elevationGainMeters: 300,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePower: 150,
    normalizedPower: null,
    weightedPower: null,
    calories: null,
    provenance: 'observed',
    ...options,
  }
}

describe('getCyclistState', () => {
  it('keeps recent windows distinct and exposes their source facts', () => {
    const state = getCyclistState([ride(2), ride(10), ride(20)], 250, now)

    expect(state.data.activityCount).toBe(3)
    expect(state.volume).toMatchObject({
      last7DaysHours: 1,
      last28DaysHours: 3,
      last84DaysHours: 3,
      last7DaysRides: 1,
    })
    expect(state.load.last7Days).toBe(36)
    expect(state.trend).toBe('steady')
  })

  it('recommends recovery after a meaningful load jump', () => {
    const state = getCyclistState(
      [
        ride(1, { durationSeconds: 3 * 60 * 60, averagePower: 240 }),
        ride(2, { durationSeconds: 3 * 60 * 60, averagePower: 240 }),
        ride(9),
        ride(16),
        ride(23),
      ],
      250,
      now,
    )

    expect(state.load.acuteToChronicRatio).toBeGreaterThanOrEqual(1.3)
    expect(state.recommendation).toBe('recover')
    expect(state.intensity.last7DaysHardRides).toBe(2)
  })

  it('does not pretend a new rider has a trend', () => {
    const state = getCyclistState([ride(1)], null, now)

    expect(state.trend).toBe('insufficient_data')
    expect(state.recommendation).toBe('maintain')
    expect(state.load.acuteToChronicRatio).toBeNull()
  })
})
