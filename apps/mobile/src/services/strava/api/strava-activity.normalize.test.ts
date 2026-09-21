import { describe, expect, it } from 'vitest'

import { activitySchema } from '@/lib/domain'

import { normalizeStravaActivity } from './strava-activity.normalize'

/** A complete road ride, as Strava returns it. */
const roadRide = {
  id: 12345678,
  sport_type: 'Ride',
  type: 'Ride',
  start_date: '2026-09-14T07:32:11Z',
  moving_time: 4523,
  elapsed_time: 5100,
  distance: 42195.4,
  total_elevation_gain: 612.8,
  average_heartrate: 142.3,
  max_heartrate: 176,
  average_watts: 187.4,
  weighted_average_watts: 203.9,
  kilojoules: 847.2,
}

describe('normalizeStravaActivity', () => {
  it('maps a road ride onto the domain model', () => {
    expect(normalizeStravaActivity(roadRide)).toEqual({
      id: 'strava-12345678',
      source: 'strava',
      externalId: '12345678',
      sportType: 'road',
      startAt: '2026-09-14T07:32:11.000Z',
      durationSeconds: 4523,
      distanceMeters: 42195.4,
      elevationGainMeters: 612.8,
      averageHeartRate: 142.3,
      maxHeartRate: 176,
      averagePower: 187.4,
      normalizedPower: null,
      weightedPower: 203.9,
      calories: 847,
      provenance: 'observed',
      provenanceDetails: expect.objectContaining({
        provider: 'strava',
        freshness: 'current',
        attribution: null,
      }),
    })
  })

  it('produces something the domain schema accepts', () => {
    expect(activitySchema.safeParse(normalizeStravaActivity(roadRide)).success).toBe(true)
  })

  it('keeps Strava weighted power under its own name, never as normalised power', () => {
    const activity = normalizeStravaActivity(roadRide)

    // Mapping it to normalizedPower would produce plausible, wrong numbers that
    // every downstream figure would inherit without anything looking broken.
    expect(activity?.normalizedPower).toBeNull()
    expect(activity?.weightedPower).toBe(203.9)
  })

  it.each([
    ['GravelRide', 'gravel'],
    ['MountainBikeRide', 'mtb'],
    ['VirtualRide', 'indoor_cycling'],
  ])('maps %s to %s', (sportType, expected) => {
    expect(normalizeStravaActivity({ ...roadRide, sport_type: sportType })?.sportType).toBe(
      expected,
    )
  })

  it.each([['Run'], ['Swim'], ['Walk'], ['EBikeRide'], ['EMountainBikeRide'], ['Velomobile']])(
    'drops %s rather than filing it under a cycling category',
    (sportType) => {
      expect(normalizeStravaActivity({ ...roadRide, sport_type: sportType })).toBeNull()
    },
  )

  it('falls back to the legacy type when sport_type is absent', () => {
    const { sport_type: _omitted, ...withoutSportType } = roadRide

    expect(normalizeStravaActivity(withoutSportType)?.sportType).toBe('road')
  })

  it('treats a dropped sensor as missing rather than as a real zero', () => {
    const activity = normalizeStravaActivity({
      ...roadRide,
      average_heartrate: 0,
      average_watts: 0,
    })

    // A stored zero would drag every average computed downstream.
    expect(activity?.averageHeartRate).toBeNull()
    expect(activity?.averagePower).toBeNull()
  })

  it('accepts missing sensor fields without failing', () => {
    const { average_heartrate: _hr, average_watts: _power, ...withoutSensors } = roadRide

    const activity = normalizeStravaActivity(withoutSensors)

    expect(activity?.averageHeartRate).toBeNull()
    expect(activity?.averagePower).toBeNull()
    expect(activity?.weightedPower).toBe(203.9)
  })

  it.each([
    ['a missing id', { ...roadRide, id: undefined }],
    ['a missing start date', { ...roadRide, start_date: undefined }],
    ['a non-numeric distance', { ...roadRide, distance: 'far' }],
    ['a negative duration', { ...roadRide, moving_time: -1 }],
    ['not an object', 'nonsense'],
    ['null', null],
  ])('returns null for %s instead of throwing', (_label, input) => {
    expect(normalizeStravaActivity(input)).toBeNull()
  })
})
