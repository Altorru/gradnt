import type { WeeklySummary } from '@/lib/domain/notification-plan'
import {
  getWeeklyDistanceSeries,
  getWeeklyElevationSeries,
  getWeeklyRideCountSeries,
  getWeeklyVolumeSeries,
} from '@/lib/domain/selectors'
import type { Activity, Goal } from '@/lib/domain/schemas'

/**
 * A string that changes exactly when the desired set could change.
 *
 * Cheaper than a deep comparison and honest about what matters: the reconcile
 * is idempotent, so one run too many costs a native call and nothing else.
 */
export function syncFingerprint(input: {
  workouts: { id: string; status: string }[]
  lastSyncedAt: number
  preferences: Record<string, unknown>
  language: string
}): string {
  return JSON.stringify(input)
}

/** The most recent ride we know about, or null. */
export function latestActivityAt(activities: Activity[]): string | null {
  return activities.reduce<string | null>(
    (latest, activity) =>
      latest === null || activity.startAt > latest ? activity.startAt : latest,
    null,
  )
}

/**
 * The last seven days, from the same selectors the Progress screen reads.
 *
 * The series' final bucket rather than a total over the array: the activities
 * query covers twelve weeks, so summing it would have the weekly digest quote a
 * quarter of riding as though it were a week.
 */
export function weeklySummaryFrom(activities: Activity[]): WeeklySummary {
  return {
    rides: getWeeklyRideCountSeries(activities).at(-1) ?? 0,
    hours: getWeeklyVolumeSeries(activities).at(-1) ?? 0,
    distanceKm: getWeeklyDistanceSeries(activities).at(-1) ?? 0,
    elevationGainM: getWeeklyElevationSeries(activities).at(-1) ?? 0,
  }
}

/** The goal and how far along it is, or null when there is nothing to celebrate. */
export function goalProgress(
  goal: Goal | null | undefined,
  progress: number,
): { key: string; progress: number } | null {
  return goal == null ? null : { key: goal.type, progress }
}
