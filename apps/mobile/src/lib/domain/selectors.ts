import type { Activity, Goal, PlannedWorkout, TrainingMetrics } from './schemas'

export type ActivityDataState = 'none' | 'observed'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type DeterministicTrainingInsight = {
  title: string
  message: string
  provenance: 'declared' | 'observed'
}

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

export function getActivityDataState(activities: Activity[]): ActivityDataState {
  return activities.length > 0 ? 'observed' : 'none'
}

export function getTotalDistanceKm(activities: Activity[]): number {
  return (
    Math.round(
      (activities.reduce((total, activity) => total + activity.distanceMeters, 0) / 1000) * 10,
    ) / 10
  )
}

export function getTotalElevationGainMeters(activities: Activity[]): number {
  return Math.round(activities.reduce((total, activity) => total + activity.elevationGainMeters, 0))
}

/**
 * Training hours per week, oldest first, for the last `weeks` weeks.
 *
 * Replaces the invented series these charts used to draw. A fabricated shape
 * presented next to real totals is worse than no chart, because nothing on the
 * screen distinguishes the two.
 *
 * Weeks with no riding are genuine zeroes and stay in the series, so a gap
 * reads as a gap rather than as compression.
 */
export function getWeeklyVolumeSeries(activities: Activity[], weeks = 8): number[] {
  const buckets = new Array<number>(weeks).fill(0)
  const now = Date.now()

  for (const activity of activities) {
    const startAt = Date.parse(activity.startAt)

    if (Number.isNaN(startAt)) {
      continue
    }

    const index = weeks - 1 - Math.floor((now - startAt) / WEEK_MS)

    if (index >= 0 && index < weeks) {
      buckets[index] += activity.durationSeconds / 3600
    }
  }

  return buckets.map((hours) => Math.round(hours * 10) / 10)
}

export function getDeterministicTrainingInsight(
  activities: Activity[],
  declaredWeeklyVolumeBand: 'lt3' | '3to6' | '6to10' | 'gt10',
): DeterministicTrainingInsight {
  const activityState = getActivityDataState(activities)

  if (activityState === 'none') {
    return {
      title: 'Point de départ déclaré',
      message: `Le premier plan s’appuie sur ton volume déclaré (${declaredWeeklyVolumeBand}) et tes disponibilités. Il deviendra plus précis après tes premières sorties.`,
      provenance: 'declared',
    }
  }

  return {
    title: 'Tendance observée',
    message: `${getWeeklyRideCount(activities)} sortie${activities.length > 1 ? 's' : ''} observée${activities.length > 1 ? 's' : ''} dans la période analysée.`,
    provenance: 'observed',
  }
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
