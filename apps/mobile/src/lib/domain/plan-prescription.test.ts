import { describe, expect, it } from 'vitest'

import type { CyclistState } from './cyclist-state'
import { getPlanPrescription } from './plan-prescription'

const observedState: CyclistState = {
  asOf: '2026-09-22T12:00:00.000Z',
  data: {
    activityCount: 12,
    firstActivityAt: '2026-08-01T12:00:00.000Z',
    latestActivityAt: '2026-09-21T12:00:00.000Z',
  },
  volume: {
    last7DaysHours: 4,
    last28DaysHours: 16,
    last84DaysHours: 35,
    last7DaysRides: 3,
    last28DaysRides: 10,
  },
  load: { last7Days: 340, last28Days: 1_200, acuteToChronicRatio: 1.13 },
  intensity: { last7DaysHardRides: 1, last7DaysHardMinutes: 60 },
  trend: 'steady',
  recommendation: 'progress',
}

describe('getPlanPrescription', () => {
  it('uses onboarding only until enough observed history exists', () => {
    expect(getPlanPrescription('3to6', null)).toEqual({
      weeklyMinutes: 240,
      firstWorkoutType: 'endurance',
      rationale: 'declared_baseline',
    })
  })

  it('anchors the budget to observed volume inside a safe bound', () => {
    expect(getPlanPrescription('3to6', observedState)).toEqual({
      weeklyMinutes: 240,
      firstWorkoutType: 'endurance',
      rationale: 'observed_baseline',
    })
  })

  it('starts conservatively when the cyclist state requests recovery', () => {
    const state = { ...observedState, recommendation: 'recover' as const }
    expect(getPlanPrescription('3to6', state)).toEqual({
      weeklyMinutes: 168,
      firstWorkoutType: 'recovery',
      rationale: 'recovery',
    })
  })
})
