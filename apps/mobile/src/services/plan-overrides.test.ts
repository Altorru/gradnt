import { describe, expect, it } from 'vitest'

import { trainingPlanSchema, type TrainingPlan } from '../lib/domain'

import { applyPlanOverrides } from './plan-overrides'
import type { PlanOverride } from './plan.persistence'

/**
 * Built here rather than imported from the domain fixtures.
 *
 * Those fixtures were the app's demo data and have been deleted; this test only
 * ever needed three workouts with distinct ids, and owns them now.
 */
function planWithThreeWorkouts(): TrainingPlan {
  const date = '2026-09-10T07:00:00.000Z'

  return trainingPlanSchema.parse({
    id: 'plan-test',
    startDate: date,
    endDate: date,
    goalId: 'goal-test',
    version: 1,
    status: 'active',
    weeks: [
      {
        weekNumber: 1,
        workouts: [1, 2, 3].map((index) => ({
          id: `workout-test-${index}`,
          date,
          type: 'endurance',
          title: `Séance ${index}`,
          durationMinutes: 60,
          intensityTarget: 'Z2',
          structure: 'Continu',
          status: 'planned',
          reason: 'Test',
        })),
      },
    ],
  })
}

describe('applyPlanOverrides', () => {
  it('applies completion and move overrides without mutating the base plan', () => {
    const basePlan = planWithThreeWorkouts()
    const overrides: PlanOverride[] = [
      {
        workoutId: 'workout-test-1',
        status: 'completed',
        date: null,
      },
      {
        workoutId: 'workout-test-2',
        status: 'moved',
        date: '2026-09-11T07:00:00.000Z',
      },
    ]

    const nextPlan = applyPlanOverrides(basePlan, overrides)
    const nextWorkouts = nextPlan.weeks[0]?.workouts ?? []
    const baseWorkouts = basePlan.weeks[0]?.workouts ?? []

    expect(nextWorkouts[0]).toMatchObject({ status: 'completed' })
    expect(nextWorkouts[1]).toMatchObject({
      status: 'moved',
      date: '2026-09-11T07:00:00.000Z',
    })
    expect(nextWorkouts[2]).toEqual(baseWorkouts[2])
    expect(baseWorkouts[0]?.status).toBe('planned')
  })

  it('uses the latest override when duplicate entries exist', () => {
    const nextPlan = applyPlanOverrides(planWithThreeWorkouts(), [
      { workoutId: 'workout-test-1', status: 'skipped', date: null },
      { workoutId: 'workout-test-1', status: 'completed', date: null },
    ])

    expect(nextPlan.weeks[0]?.workouts[0]?.status).toBe('completed')
  })
})
