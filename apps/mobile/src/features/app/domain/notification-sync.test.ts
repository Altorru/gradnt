import { describe, expect, it } from 'vitest'

import { goalProgress, latestActivityAt, syncFingerprint } from './notification-sync'

import type { Activity, Goal } from '@/lib/domain/schemas'

function activity(overrides: Partial<Activity> & { startAt: string }): Activity {
  return {
    id: overrides.startAt,
    source: 'strava',
    externalId: null,
    sportType: 'road',
    durationSeconds: 0,
    distanceMeters: 0,
    elevationGainMeters: 0,
    averageHeartRate: null,
    maxHeartRate: null,
    averagePower: null,
    normalizedPower: null,
    weightedPower: null,
    calories: null,
    provenance: 'observed',
    ...overrides,
  }
}

/** An instant `days` ago, so the rolling-week buckets are decided by the test. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

describe('syncFingerprint', () => {
  it('changes when the language changes', () => {
    const base = { workouts: [], lastSyncedAt: 0, preferences: {}, language: 'fr' }

    expect(syncFingerprint({ ...base, language: 'en' })).not.toBe(syncFingerprint(base))
  })

  it('changes when a workout moves', () => {
    const a = {
      workouts: [{ id: 'w1', status: 'planned' }],
      lastSyncedAt: 0,
      preferences: {},
      language: 'fr',
    }
    const b = { ...a, workouts: [{ id: 'w1', status: 'moved' }] }

    expect(syncFingerprint(a)).not.toBe(syncFingerprint(b))
  })

  it('is stable when nothing meaningful changed', () => {
    const value = {
      workouts: [{ id: 'w1', status: 'planned' }],
      lastSyncedAt: 7,
      preferences: { a: true },
      language: 'fr',
    }

    expect(syncFingerprint(value)).toBe(syncFingerprint({ ...value }))
  })
})

describe('latestActivityAt', () => {
  it('is null with no rides, so the nudge tells idleness from never having looked', () => {
    expect(latestActivityAt([])).toBeNull()
  })

  it('is the newest ride, whatever order they arrive in', () => {
    const old = daysAgo(9)
    const recent = daysAgo(2)

    expect(latestActivityAt([activity({ startAt: old }), activity({ startAt: recent })])).toBe(
      recent,
    )
    expect(latestActivityAt([activity({ startAt: recent }), activity({ startAt: old })])).toBe(
      recent,
    )
  })
})

describe('goalProgress', () => {
  const goal = { type: 'distance' } as Goal

  it('keys the progress by the goal type, which is what the store remembers', () => {
    expect(goalProgress(goal, 42)).toEqual({ key: 'distance', progress: 42 })
  })

  it('is null without a goal, so nothing is announced to a rider who set none', () => {
    expect(goalProgress(null, 42)).toBeNull()
    expect(goalProgress(undefined, 42)).toBeNull()
  })
})
