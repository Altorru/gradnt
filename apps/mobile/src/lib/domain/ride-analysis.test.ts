import { describe, expect, it } from 'vitest'

import { analyzeRide } from './ride-analysis'
import type { Activity } from './schemas'

function ride(overrides: Partial<Activity> = {}): Activity {
  return {
    id: 'ride-1',
    source: 'strava',
    externalId: '1',
    sportType: 'road',
    startAt: '2026-09-18T08:00:00.000Z',
    durationSeconds: 3600,
    distanceMeters: 30000,
    elevationGainMeters: 300,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePower: 180,
    normalizedPower: 200,
    weightedPower: null,
    calories: null,
    provenance: 'observed',
    ...overrides,
  }
}

describe('analyzeRide', () => {
  it('calculates a power-based intensity and load without asking AI', () => {
    const result = analyzeRide(ride(), [], 250)
    expect(result.confidence).toBe('power')
    expect(result.intensity).toBe('tempo')
    expect(result.facts.intensityFactor).toBe(0.8)
    expect(result.loadScore).toBe(64)
  })

  it('falls back to duration when no power or FTP exists', () => {
    const result = analyzeRide(ride({ averagePower: null, normalizedPower: null }), [], null)
    expect(result.confidence).toBe('duration')
    expect(result.intensity).toBe('endurance')
    expect(result.facts.powerWatts).toBeNull()
  })

  it('uses prior rides as a transparent comparison baseline', () => {
    const result = analyzeRide(
      ride({ durationSeconds: 7200, startAt: '2026-09-18T08:00:00.000Z' }),
      [ride({ id: 'older', durationSeconds: 3600, startAt: '2026-09-17T08:00:00.000Z' })],
      250,
    )
    expect(result.comparedRides).toBe(1)
    expect(result.trend).toBe('above')
  })

  it('prioritises recovery when the rider reports high fatigue', () => {
    const result = analyzeRide(ride(), [], 250, { perceivedEffort: 6, fatigue: 'high' })
    expect(result.nextAction).toBe('recover')
  })
})
