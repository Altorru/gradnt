import { generateFirstPlan, type PlannedWorkout, type TrainingPlan } from '@/lib/domain'

import { loadOnboardingSnapshot } from '@/features/onboarding/services/onboarding.persistence'

import { loadPlanOverrides, savePlanOverrides, type PlanOverride } from './plan.persistence'
import { gradntRepository } from './gradnt.repository'

export interface PlanRepository {
  getPlan(): Promise<TrainingPlan>
  skipWorkout(workoutId: string): Promise<TrainingPlan>
  completeWorkout(workoutId: string): Promise<TrainingPlan>
  moveWorkout(workoutId: string, date: Date): Promise<TrainingPlan>
}

function applyOverrides(plan: TrainingPlan, overrides: PlanOverride[]): TrainingPlan {
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

async function getBasePlan(): Promise<TrainingPlan> {
  const snapshot = await loadOnboardingSnapshot()

  if (!snapshot?.profile || !snapshot.goal || !snapshot.availability) {
    return gradntRepository.getTrainingPlan()
  }

  const workouts = generateFirstPlan({
    profile: snapshot.profile,
    goal: snapshot.goal,
    availability: snapshot.availability,
    startDate: new Date(),
  })

  if (workouts.length === 0) {
    return gradntRepository.getTrainingPlan()
  }

  return {
    id: 'plan-local-first',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    goalId: 'goal-local-first',
    weeks: [{ weekNumber: 1, workouts }],
    version: 1,
    status: 'active',
  }
}

export class LocalPlanRepository implements PlanRepository {
  async getPlan() {
    const plan = await getBasePlan()
    const overrides = await loadPlanOverrides()
    return applyOverrides(plan, overrides)
  }

  async updateWorkoutOverride(override: PlanOverride): Promise<TrainingPlan> {
    const overrides = await loadPlanOverrides()
    const nextOverrides = [
      ...overrides.filter((currentOverride) => currentOverride.workoutId !== override.workoutId),
      override,
    ]

    await savePlanOverrides(nextOverrides)
    return this.getPlan()
  }

  async skipWorkout(workoutId: string) {
    return this.updateWorkoutOverride({
      workoutId,
      status: 'skipped',
      date: null,
    })
  }

  async completeWorkout(workoutId: string) {
    return this.updateWorkoutOverride({
      workoutId,
      status: 'completed',
      date: null,
    })
  }

  async moveWorkout(workoutId: string, date: Date) {
    return this.updateWorkoutOverride({
      workoutId,
      status: 'moved',
      date: date.toISOString(),
    })
  }
}

export const planRepository = new LocalPlanRepository()

export function getPlanWorkouts(plan: TrainingPlan): PlannedWorkout[] {
  return plan.weeks.flatMap((week) => week.workouts)
}
