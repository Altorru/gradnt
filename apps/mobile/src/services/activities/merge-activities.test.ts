import { describe, expect, it } from 'vitest'
import type { Activity } from '@/lib/domain'

import { mergeActivities } from './merge-activities'

const base: Activity = {
  id: 'strava-1',
  source: 'strava',
  externalId: '1',
  sportType: 'road',
  startAt: '2026-09-20T08:00:00.000Z',
  durationSeconds: 3600,
  distanceMeters: 30000,
  elevationGainMeters: 250,
  averageHeartRate: null,
  maxHeartRate: null,
  averagePower: null,
  normalizedPower: null,
  weightedPower: null,
  calories: null,
  provenance: 'observed',
}

describe('merged ride sources', () => {
  it('counts an original FIT and its Strava copy once, preferring measured FIT fields', () => {
    const file: Activity = {
      ...base,
      id: 'file-2',
      source: 'file',
      externalId: null,
      startAt: '2026-09-20T08:00:30.000Z',
      averagePower: 220,
    }
    expect(mergeActivities([base], [file])).toEqual([file])
  })

  it('keeps distinct rides even when they occur on the same day', () => {
    const second: Activity = {
      ...base,
      id: 'file-2',
      source: 'file',
      externalId: null,
      startAt: '2026-09-20T11:00:00.000Z',
    }
    expect(mergeActivities([base], [second])).toHaveLength(2)
  })
})
