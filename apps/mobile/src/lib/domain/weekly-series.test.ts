import { describe, expect, it } from 'vitest'

import { getWeeklyRideCountSeries, getWeeklyVolumeSeries } from './selectors'
import type { Activity } from './schemas'

const DAY = 24 * 60 * 60 * 1000

function activity(daysAgo: number, hours: number): Activity {
  return {
    id: `strava-${daysAgo}-${hours}`,
    source: 'strava',
    externalId: '1',
    sportType: 'road',
    startAt: new Date(Date.now() - daysAgo * DAY).toISOString(),
    durationSeconds: hours * 3600,
    distanceMeters: 30000,
    elevationGainMeters: 300,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePower: null,
    normalizedPower: null,
    weightedPower: null,
    calories: null,
    provenance: 'observed',
  }
}

describe('getWeeklyVolumeSeries', () => {
  it('sums hours into the week each ride belongs to', () => {
    // The last bucket is the week in progress; the 8th from the end is 8 weeks
    // back.
    const series = getWeeklyVolumeSeries([activity(1, 2), activity(2, 1)], 8)

    expect(series).toHaveLength(8)
    expect(series.at(-1)).toBe(3)
  })

  it('keeps weeks with no riding as zeroes, so a gap reads as a gap', () => {
    const series = getWeeklyVolumeSeries([activity(1, 2)], 8)

    expect(series.slice(0, -1)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })

  it('ignores rides older than the window', () => {
    const series = getWeeklyVolumeSeries([activity(1, 2), activity(90, 5)], 8)

    expect(series.at(-1)).toBe(2)
    expect(series.reduce((sum, hours) => sum + hours, 0)).toBe(2)
  })
})

describe('getWeeklyRideCountSeries', () => {
  it('counts rides per week rather than hours', () => {
    // Three short rides are three rides, and one long one is one.
    const series = getWeeklyRideCountSeries([activity(1, 0.5), activity(2, 0.5), activity(3, 5)], 8)

    expect(series.at(-1)).toBe(3)
  })

  it('buckets a ride into the same week as the volume series does', () => {
    // The two charts sit on one screen; a ride landing in different weeks for
    // each of them would make the screen disagree with itself.
    const rides = [activity(1, 2), activity(9, 3), activity(20, 1)]
    const hours = getWeeklyVolumeSeries(rides, 8)
    const counts = getWeeklyRideCountSeries(rides, 8)

    const weeksWithHours = hours.map((value) => value > 0)
    const weeksWithRides = counts.map((value) => value > 0)

    expect(weeksWithRides).toEqual(weeksWithHours)
  })

  it('reports whole numbers', () => {
    const series = getWeeklyRideCountSeries([activity(1, 2)], 4)

    for (const value of series) {
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})
