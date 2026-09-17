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

/** The goal and how far along it is, or null when there is nothing to celebrate. */
export function goalProgress(
  goal: Goal | null | undefined,
  progress: number,
): { key: string; progress: number } | null {
  return goal == null ? null : { key: goal.type, progress }
}
