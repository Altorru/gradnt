import { describe, expect, it } from 'vitest'

import type { Activity, PlannedWorkout } from './schemas'
import { getDeterministicCoachDecision } from './coach-decision'

function ride(id: string, startAt: string, durationSeconds = 3600): Activity {
  return {
    id,
    source: 'strava',
    externalId: id,
    sportType: 'road',
    startAt,
    durationSeconds,
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
}

function workout(id: string, date: string): PlannedWorkout {
  return {
    id,
    date,
    type: 'endurance',
    durationMinutes: 60,
    status: 'planned',
    goalType: 'fitness',
  }
}

describe('deterministic Coach decision', () => {
  it('gives a first action when there is no ride history', () => {
    expect(getDeterministicCoachDecision([], [])).toMatchObject({ kind: 'start' })
  })

  it('points to the next planned workout', () => {
    const decision = getDeterministicCoachDecision(
      [ride('ride', new Date().toISOString())],
      [workout('workout', new Date(Date.now() + 86_400_000).toISOString())],
    )
    expect(decision).toMatchObject({ kind: 'next_workout', nextWorkoutId: 'workout' })
  })

  it('recommends recovery after a large week-over-week load jump', () => {
    const now = Date.now()
    const recent = new Date(now - 2 * 86_400_000).toISOString()
    const previous = new Date(now - 9 * 86_400_000).toISOString()
    const rides = [
      ride('recent-a', recent, 4 * 3600),
      ride('recent-b', recent, 4 * 3600),
      ride('old', previous),
    ]
    expect(getDeterministicCoachDecision(rides, [])).toMatchObject({ kind: 'recover' })
  })
})
