import { describe, expect, it } from 'vitest'

import {
  getWeekWindow,
  getWeeklyDistanceSeries,
  getWeeklyRideCountSeries,
  getWeeklyVolumeSeries,
  getWindowDelta,
} from './selectors'
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

describe('getWeeklyDistanceSeries', () => {
  it('sums kilometres into the week each ride belongs to', () => {
    const series = getWeeklyDistanceSeries([activity(1, 2), activity(2, 1)], 8)

    // Both stub rides are 30 km, so the current window holds 60.
    expect(series.at(-1)).toBe(60)
  })
})

describe('getWindowDelta', () => {
  it('compares the newest window with the one before it', () => {
    const delta = getWindowDelta([1, 2, 3, 8])

    expect(delta).toEqual({ current: 8, previous: 3, delta: 5 })
  })

  it('keeps the sign, so a fall is distinguishable from a rise', () => {
    expect(getWindowDelta([9, 4])?.delta).toBe(-5)
  })

  it('reports no change as zero rather than as nothing', () => {
    expect(getWindowDelta([4, 4])?.delta).toBe(0)
  })

  it('has nothing to compare with a single window', () => {
    // A rider's first week has no previous one, and inventing a comparison
    // against zero would show a triumphant rise out of nothing.
    expect(getWindowDelta([4])).toBeNull()
    expect(getWindowDelta([])).toBeNull()
  })

  it('rounds to one decimal, like the series it reads', () => {
    expect(getWindowDelta([1.04, 1.09])?.delta).toBe(0.1)
  })
})

describe('getWeekWindow', () => {
  const now = new Date('2026-09-16T12:00:00.000Z')

  it('ends the newest window at now', () => {
    // The last bucket is the week in progress, so its window closes on today.
    const window = getWeekWindow(7, 8, now)

    expect(window.end.toISOString()).toBe(now.toISOString())
    expect(window.start.toISOString()).toBe(new Date(now.getTime() - 7 * DAY).toISOString())
  })

  it('walks back a week at a time', () => {
    const newest = getWeekWindow(7, 8, now)
    const previous = getWeekWindow(6, 8, now)

    // Contiguous: one window ends exactly where the next begins, or a ride
    // could fall between two of them.
    expect(previous.end.toISOString()).toBe(newest.start.toISOString())
  })

  it('spans exactly the window the series covers', () => {
    // Eight points, so the oldest window opens eight weeks back and the newest
    // closes today. Anything narrower would leave rides outside the series.
    const oldest = getWeekWindow(0, 8, now)

    expect(oldest.start.toISOString()).toBe(new Date(now.getTime() - 8 * 7 * DAY).toISOString())
    expect(oldest.end.toISOString()).toBe(new Date(now.getTime() - 7 * 7 * DAY).toISOString())
  })
})
