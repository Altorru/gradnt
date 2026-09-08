import type { Activity, Goal, PlannedWorkout, TrainingMetrics } from './schemas'

export function getGoalProgressPercentage(goal: Goal, currentValue: number | null): number {
  if (goal.targetValue === null || currentValue === null || goal.targetValue <= 0) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round((currentValue / goal.targetValue) * 100)))
}

export function getRecentTrainingVolumeHours(metrics: TrainingMetrics): number {
  return Math.round((metrics.durationSeconds / 3600) * 100) / 100
}

export function getWeeklyRideCount(activities: Activity[]): number {
  return activities.length
}

export function getPlanCompletionPercentage(workouts: PlannedWorkout[]): number {
  if (workouts.length === 0) {
    return 0
  }

  const completed = workouts.filter((workout) => workout.status === 'completed').length
  return Math.round((completed / workouts.length) * 100)
}

export function getTrendDirection(
  currentValue: number,
  previousValue: number,
): 'up' | 'down' | 'stable' {
  if (currentValue > previousValue) {
    return 'up'
  }

  if (currentValue < previousValue) {
    return 'down'
  }

  return 'stable'
}

export function getNextWorkout(workouts: PlannedWorkout[]): PlannedWorkout | null {
  return workouts.find((workout) => workout.status === 'planned') ?? null
}
