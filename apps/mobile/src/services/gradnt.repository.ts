import { loadOnboardingSnapshot } from '@/features/onboarding/services/onboarding.persistence'
import {
  demoActivities,
  demoAthlete,
  demoGoal,
  demoMetrics,
  demoTrainingPlan,
  generateFirstPlan,
  trainingPlanSchema,
  type Activity,
  type AthleteProfile,
  type DataProvenance,
  type Goal,
  type PlannedWorkout,
  type TrainingMetrics,
  type TrainingPlan,
} from '@/lib/domain'

export type GoalValueSnapshot = {
  value: number | null
  provenance: Extract<DataProvenance, 'observed' | 'mock' | 'declared'>
}

export interface GradntRepository {
  getAthlete(): Promise<AthleteProfile>
  getGoal(): Promise<Goal>
  getCurrentGoalValue(): Promise<GoalValueSnapshot>
  getActivities(): Promise<Activity[]>
  getTrainingMetrics(): Promise<TrainingMetrics>
  getTrainingPlan(): Promise<TrainingPlan>
  getUpcomingWorkouts(): Promise<PlannedWorkout[]>
}

async function getGeneratedTrainingPlan(): Promise<TrainingPlan | null> {
  const snapshot = await loadOnboardingSnapshot()

  if (!snapshot?.profile || !snapshot.goal || !snapshot.availability) {
    return null
  }

  const workouts = generateFirstPlan({
    profile: snapshot.profile,
    goal: snapshot.goal,
    availability: snapshot.availability,
    startDate: new Date(),
  })

  if (workouts.length === 0) {
    return null
  }

  return trainingPlanSchema.parse({
    id: 'plan-local-first',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    goalId: 'goal-local-first',
    weeks: [{ weekNumber: 1, workouts }],
    version: 1,
    status: 'active',
  })
}

export class MockGradntRepository implements GradntRepository {
  async getAthlete() {
    const snapshot = await loadOnboardingSnapshot()

    return snapshot?.profile
      ? {
          id: 'athlete-local',
          displayName: 'Cycliste GRADNT',
          primaryDiscipline: snapshot.profile.discipline,
          experienceLevel: snapshot.profile.experience,
          weeklyVolumeBand: snapshot.profile.weeklyVolume,
          provenance: 'declared' as const,
        }
      : demoAthlete
  }

  async getGoal() {
    const snapshot = await loadOnboardingSnapshot()

    if (!snapshot?.goal) {
      return demoGoal
    }

    const targetValue = snapshot.goal.targetValue ? Number(snapshot.goal.targetValue) : null
    const targetUnit: Goal['targetUnit'] =
      snapshot.goal.type === 'ftp'
        ? 'w'
        : snapshot.goal.type === 'distance'
          ? 'km'
          : snapshot.goal.type === 'climbing'
            ? 'm'
            : 'none'

    return {
      id: 'goal-local',
      type: snapshot.goal.type,
      targetValue,
      targetUnit,
      targetDate: null,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    }
  }

  async getCurrentGoalValue(): Promise<GoalValueSnapshot> {
    return {
      value: 258,
      provenance: 'mock',
    }
  }

  async getActivities() {
    return demoActivities
  }

  async getTrainingMetrics() {
    return demoMetrics
  }

  async getTrainingPlan() {
    return (await getGeneratedTrainingPlan()) ?? demoTrainingPlan
  }

  async getUpcomingWorkouts() {
    const plan = await this.getTrainingPlan()
    return plan.weeks.flatMap((week) => week.workouts)
  }
}

export const gradntRepository: GradntRepository = new MockGradntRepository()
