import { describe, expect, it } from 'vitest'

import type { Activity, PlannedWorkout } from '@/lib/domain'
import { getAdaptationProposal } from './adaptation'

const activity: Activity = {
  id: 'ride-1',
  source: 'strava',
  externalId: 'ride-1',
  sportType: 'road',
  startAt: '2026-09-20T10:00:00.000Z',
  durationSeconds: 3600,
  distanceMeters: 30_000,
  elevationGainMeters: 200,
  averageHeartRate: null,
  maxHeartRate: null,
  averagePower: null,
  normalizedPower: null,
  weightedPower: null,
  calories: null,
  provenance: 'observed',
}

const workout: PlannedWorkout = {
  id: 'workout-1',
  date: '2026-09-22T07:00:00.000Z',
  type: 'threshold',
  durationMinutes: 60,
  status: 'planned',
  goalType: 'ftp',
}

describe('post-ride adaptation', () => {
  it('proposes moving the next workout after high fatigue', () => {
    expect(
      getAdaptationProposal(
        activity,
        { perceivedEffort: 8, feeling: 'difficult', fatigue: 'high', note: '' },
        [workout],
      ),
    ).toMatchObject({ kind: 'move', workout: { id: 'workout-1' } })
  })

  it('does not change the plan for a comfortable ride', () => {
    expect(
      getAdaptationProposal(
        activity,
        { perceivedEffort: 4, feeling: 'good', fatigue: 'low', note: '' },
        [workout],
      ),
    ).toBeNull()
  })
})
