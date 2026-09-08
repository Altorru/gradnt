import { describe, expect, it } from 'vitest'

import { demoTrainingPlan } from '../lib/domain/fixtures'

import { applyPlanOverrides } from './plan-overrides'
import type { PlanOverride } from './plan.persistence'

describe('applyPlanOverrides', () => {
  it('applies completion and move overrides without mutating the base plan', () => {
    const overrides: PlanOverride[] = [
      {
        workoutId: 'workout-demo-1',
        status: 'completed',
        date: null,
      },
      {
        workoutId: 'workout-demo-2',
        status: 'moved',
        date: '2026-09-11T07:00:00.000Z',
      },
    ]

    const nextPlan = applyPlanOverrides(demoTrainingPlan, overrides)
    const nextWorkouts = nextPlan.weeks[0]?.workouts ?? []
    const baseWorkouts = demoTrainingPlan.weeks[0]?.workouts ?? []

    expect(nextWorkouts[0]).toMatchObject({ status: 'completed' })
    expect(nextWorkouts[1]).toMatchObject({
      status: 'moved',
      date: '2026-09-11T07:00:00.000Z',
    })
    expect(nextWorkouts[2]).toEqual(baseWorkouts[2])
    expect(baseWorkouts[0]?.status).toBe('planned')
  })

  it('uses the latest override when duplicate entries exist', () => {
    const nextPlan = applyPlanOverrides(demoTrainingPlan, [
      { workoutId: 'workout-demo-1', status: 'skipped', date: null },
      { workoutId: 'workout-demo-1', status: 'completed', date: null },
    ])

    expect(nextPlan.weeks[0]?.workouts[0]?.status).toBe('completed')
  })
})
