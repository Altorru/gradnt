import type { Activity, PlannedWorkout } from './schemas'
import { getNextWorkout, getWeeklyVolumeSeries } from './selectors'

export type DeterministicCoachDecision =
  | {
      kind: 'start'
      activityCount: 0
      recentHours: 0
      previousHours: 0
      nextWorkoutId: null
    }
  | {
      kind: 'recover' | 'next_workout' | 'build_consistency'
      activityCount: number
      recentHours: number
      previousHours: number
      nextWorkoutId: string | null
    }

/**
 * Chooses one useful next decision from verified GRADNT facts. This is the
 * Strava-safe Coach: it never calls a model and never serialises ride data for
 * an external provider.
 */
export function getDeterministicCoachDecision(
  activities: Activity[],
  workouts: PlannedWorkout[],
): DeterministicCoachDecision {
  const series = getWeeklyVolumeSeries(activities, 2)
  const recentHours = Math.round((series[1] ?? 0) * 10) / 10
  const previousHours = Math.round((series[0] ?? 0) * 10) / 10

  if (activities.length === 0) {
    return {
      kind: 'start',
      activityCount: 0,
      recentHours: 0,
      previousHours: 0,
      nextWorkoutId: null,
    }
  }

  const nextWorkout = getNextWorkout(workouts)
  const loadJump = previousHours > 0 && recentHours >= previousHours * 1.25

  if (loadJump) {
    return {
      kind: 'recover',
      activityCount: activities.length,
      recentHours,
      previousHours,
      nextWorkoutId: nextWorkout?.id ?? null,
    }
  }

  if (!nextWorkout) {
    return {
      kind: 'build_consistency',
      activityCount: activities.length,
      recentHours,
      previousHours,
      nextWorkoutId: null,
    }
  }

  return {
    kind: 'next_workout',
    activityCount: activities.length,
    recentHours,
    previousHours,
    nextWorkoutId: nextWorkout.id,
  }
}
