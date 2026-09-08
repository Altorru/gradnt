import type { TrainingPlan } from '../lib/domain'

import type { PlanOverride } from './plan.persistence'

export function applyPlanOverrides(plan: TrainingPlan, overrides: PlanOverride[]): TrainingPlan {
  const overrideByWorkoutId = new Map(overrides.map((override) => [override.workoutId, override]))

  return {
    ...plan,
    weeks: plan.weeks.map((week) => ({
      ...week,
      workouts: week.workouts.map((workout) => {
        const override = overrideByWorkoutId.get(workout.id)

        if (!override) {
          return workout
        }

        return {
          ...workout,
          status: override.status,
          date: override.date ?? workout.date,
        }
      }),
    })),
  }
}
