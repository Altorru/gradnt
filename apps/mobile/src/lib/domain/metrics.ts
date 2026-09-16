import type { Activity, TrainingMetrics } from './schemas'

export function buildTrainingMetrics(
  activities: Activity[],
  periodStart: string,
  periodEnd: string,
): TrainingMetrics {
  return {
    periodStart,
    periodEnd,
    durationSeconds: activities.reduce((total, activity) => total + activity.durationSeconds, 0),
    distanceMeters: activities.reduce((total, activity) => total + activity.distanceMeters, 0),
    elevationGainMeters: activities.reduce(
      (total, activity) => total + activity.elevationGainMeters,
      0,
    ),
    activityCount: activities.length,
    provenance: activities.some((activity) => activity.provenance === 'observed')
      ? 'observed'
      : 'none',
  }
}
