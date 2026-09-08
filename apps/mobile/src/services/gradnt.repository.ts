import {
  demoActivities,
  demoAthlete,
  demoGoal,
  demoMetrics,
  demoTrainingPlan,
  demoWorkouts,
} from '@/lib/domain'
import type {
  Activity,
  AthleteProfile,
  Goal,
  PlannedWorkout,
  TrainingMetrics,
  TrainingPlan,
} from '@/lib/domain'

export interface GradntRepository {
  getAthlete(): Promise<AthleteProfile>
  getGoal(): Promise<Goal>
  getCurrentGoalValue(): Promise<number | null>
  getActivities(): Promise<Activity[]>
  getTrainingMetrics(): Promise<TrainingMetrics>
  getTrainingPlan(): Promise<TrainingPlan>
  getUpcomingWorkouts(): Promise<PlannedWorkout[]>
}

export class MockGradntRepository implements GradntRepository {
  async getAthlete() {
    return demoAthlete
  }

  async getGoal() {
    return demoGoal
  }

  async getCurrentGoalValue() {
    return 258
  }

  async getActivities() {
    return demoActivities
  }

  async getTrainingMetrics() {
    return demoMetrics
  }

  async getTrainingPlan() {
    return demoTrainingPlan
  }

  async getUpcomingWorkouts() {
    return demoWorkouts
  }
}

export const gradntRepository: GradntRepository = new MockGradntRepository()
