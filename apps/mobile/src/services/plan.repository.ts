import { generateFirstPlan, type PlannedWorkout, type TrainingPlan } from '@/lib/domain'

import { loadOnboardingSnapshot } from '@/features/onboarding/services/onboarding.persistence'

import { loadPlanOverrides, savePlanOverrides, type PlanOverride } from './plan.persistence'
import { applyPlanOverrides } from './plan-overrides'
import { gradntRepository } from './gradnt.repository'

export interface PlanRepository {
  getPlan(): Promise<TrainingPlan>
  skipWorkout(workoutId: string): Promise<TrainingPlan>
  completeWorkout(workoutId: string): Promise<TrainingPlan>
  moveWorkout(workoutId: string, date: Date): Promise<TrainingPlan>
}

async function getBasePlan(): Promise<TrainingPlan> {
  const snapshot = await loadOnboardingSnapshot()

  if (!snapshot?.profile || !snapshot.goal || !snapshot.availability) {
    return gradntRepository.getTrainingPlan()
  }

  const weeks = generateFirstPlan({
    profile: snapshot.profile,
    goal: snapshot.goal,
    availability: snapshot.availability,
    startDate: new Date(),
  })

  const workouts = weeks.flatMap((week) => week.workouts)

  if (workouts.length === 0) {
    return gradntRepository.getTrainingPlan()
  }

  return {
    id: 'plan-local-first',
    startDate: new Date().toISOString(),
    endDate: workouts.at(-1)?.date ?? new Date().toISOString(),
    goalId: 'goal-local-first',
    weeks,
    version: 1,
    status: 'active',
  }
}

export class LocalPlanRepository implements PlanRepository {
  async getPlan() {
    const plan = await getBasePlan()
    const overrides = await loadPlanOverrides()
    return applyPlanOverrides(plan, overrides)
  }

  async updateWorkoutOverride(override: PlanOverride): Promise<TrainingPlan> {
    const currentPlan = await getBasePlan()
    const workoutExists = getPlanWorkouts(currentPlan).some(
      (workout) => workout.id === override.workoutId,
    )

    if (!workoutExists) {
      throw new Error(`Séance introuvable: ${override.workoutId}`)
    }

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
