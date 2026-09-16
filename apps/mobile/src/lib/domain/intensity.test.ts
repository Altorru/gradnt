import { describe, expect, it } from 'vitest'

import { getIntensityDistribution } from './selectors'
import type { Activity } from './schemas'

const FTP = 200

/** A one-hour ride at the given normalised power. */
function ride(power: number | null, hours = 1): Activity {
  return {
    id: `strava-${power}`,
    source: 'strava',
    externalId: '1',
    sportType: 'road',
    startAt: new Date().toISOString(),
    durationSeconds: hours * 3600,
    distanceMeters: 30000,
    elevationGainMeters: 300,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePower: null,
    normalizedPower: null,
    weightedPower: power,
    calories: null,
    provenance: 'observed',
  }
}

describe('getIntensityDistribution', () => {
  it('places a ride in the band its intensity factor falls in', () => {
    // Against an FTP of 200: 100 W is 0.5 (recovery), 220 W is 1.1 (VO₂ max).
    const distribution = getIntensityDistribution([ride(100), ride(220)], FTP)

    expect(distribution?.map((entry) => entry.zone)).toEqual(['recovery', 'vo2max'])
  })

  it.each([
    [100, 'recovery'],
    [140, 'endurance'],
    [170, 'tempo'],
    [200, 'threshold'],
    [260, 'vo2max'],
  ])('bands %i W against a 200 W FTP as %s', (power, zone) => {
    expect(getIntensityDistribution([ride(power)], FTP)?.[0]?.zone).toBe(zone)
  })

  it('weights each band by time, not by ride count', () => {
    // One hour easy and three hours hard: the hard band holds three quarters.
    const distribution = getIntensityDistribution([ride(100, 1), ride(220, 3)], FTP)

    const vo2max = distribution?.find((entry) => entry.zone === 'vo2max')

    expect(vo2max?.hours).toBe(3)
    expect(vo2max?.share).toBe(0.75)
  })

  it('has shares that add up to one', () => {
    const distribution = getIntensityDistribution([ride(100), ride(170), ride(220)], FTP)
    const total = distribution?.reduce((sum, entry) => sum + entry.share, 0) ?? 0

    expect(total).toBeCloseTo(1, 5)
  })

  it('leaves out bands nothing was ridden in', () => {
    // A band at zero per cent is noise in a legend.
    const distribution = getIntensityDistribution([ride(220)], FTP)

    expect(distribution).toHaveLength(1)
  })

  it('falls back to average power when there is no weighted power', () => {
    const averageOnly = { ...ride(null), averagePower: 220 }

    expect(getIntensityDistribution([averageOnly], FTP)?.[0]?.zone).toBe('vo2max')
  })

  it('reports nothing without an FTP, rather than inventing a scale', () => {
    // The common case: no FTP recorded, so there is nothing to divide by and no
    // honest way to place a ride on an intensity scale.
    expect(getIntensityDistribution([ride(220)], null)).toBeNull()
    expect(getIntensityDistribution([ride(220)], 0)).toBeNull()
  })

  it('reports nothing when no ride recorded power', () => {
    expect(getIntensityDistribution([ride(null)], FTP)).toBeNull()
  })

  it('excludes rides without power from the base, rather than calling them easy', () => {
    // Two power rides and one without: the shares describe the two, so they
    // still add up to one. Counting the third as recovery would be a guess.
    const distribution = getIntensityDistribution([ride(220), ride(220), ride(null)], FTP)

    expect(distribution).toHaveLength(1)
    expect(distribution?.[0]?.share).toBe(1)
    expect(distribution?.[0]?.hours).toBe(2)
  })
})
