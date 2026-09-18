import { describe, expect, it } from 'vitest'

import { compareRideToPlan } from './workout-comparison'
import type { Activity, PlannedWorkout } from './schemas'

const activity: Activity = {
  id: 'strava-1',
  source: 'strava',
  externalId: '1',
  sportType: 'road',
  startAt: '2026-09-18T08:00:00.000Z',
  durationSeconds: 3600,
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
const workout: PlannedWorkout = {
  id: 'workout-1',
  date: '2026-09-18T07:00:00.000Z',
  type: 'endurance',
  durationMinutes: 60,
  status: 'planned',
  goalType: 'fitness',
}

describe('compareRideToPlan', () => {
  it('matches the closest non-skipped session without changing it', () => {
    expect(compareRideToPlan(activity, [workout])).toMatchObject({
      kind: 'matched',
      outcome: 'on_target',
      differenceMinutes: 0,
      workout,
    })
    expect(workout.status).toBe('planned')
  })

  it('leaves a ride unplanned outside the association window', () => {
    expect(compareRideToPlan(activity, [{ ...workout, date: '2026-09-20T08:00:00.000Z' }])).toEqual(
      { kind: 'unplanned' },
    )
  })

  it('reports a material duration gap', () => {
    expect(compareRideToPlan({ ...activity, durationSeconds: 20 * 60 }, [workout])).toMatchObject({
      kind: 'matched',
      outcome: 'shorter',
      differenceMinutes: -40,
    })
  })
})
