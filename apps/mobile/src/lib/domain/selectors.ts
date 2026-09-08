import type { Activity, Goal, PlannedWorkout, TrainingMetrics } from './schemas'

export type ActivityDataState = 'none' | 'mock' | 'observed'

export type DeterministicTrainingInsight = {
  title: string
  message: string
  provenance: 'declared' | 'observed' | 'mock'
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
  if (activities.some((activity) => activity.provenance === 'observed')) {
    return 'observed'
  }

  if (activities.some((activity) => activity.provenance === 'mock')) {
    return 'mock'
  }

  return 'none'
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

  if (activityState === 'mock') {
    return {
      title: 'Données de démonstration',
      message:
        'Ces indicateurs illustrent l’expérience GRADNT. Ils seront remplacés par tes activités importées lorsque Strava sera connecté.',
      provenance: 'mock',
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
