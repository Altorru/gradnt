import type { Activity, PlannedWorkout } from './schemas'

export type WorkoutComparison =
  | { kind: 'unplanned' }
  | {
      kind: 'matched'
      workout: PlannedWorkout
      actualMinutes: number
      differenceMinutes: number
      outcome: 'shorter' | 'on_target' | 'longer'
    }

const MATCH_WINDOW_MS = 36 * 60 * 60 * 1000

/**
 * Finds one calendar session close enough to a real ride to discuss it with
 * the rider. It does not complete, move, or otherwise alter the plan.
 */
export function compareRideToPlan(
  activity: Activity,
  workouts: PlannedWorkout[],
): WorkoutComparison {
  const rideAt = Date.parse(activity.startAt)
  const candidate = workouts
    .filter((workout) => workout.status !== 'skipped')
    .map((workout) => ({ workout, distance: Math.abs(Date.parse(workout.date) - rideAt) }))
    .filter(({ distance }) => distance <= MATCH_WINDOW_MS)
    .sort((left, right) => left.distance - right.distance)[0]?.workout

  if (!candidate) return { kind: 'unplanned' }
  const actualMinutes = Math.round(activity.durationSeconds / 60)
  const differenceMinutes = actualMinutes - candidate.durationMinutes
  const ratio = actualMinutes / candidate.durationMinutes
  return {
    kind: 'matched',
    workout: candidate,
    actualMinutes,
    differenceMinutes,
    outcome: ratio < 0.8 ? 'shorter' : ratio > 1.2 ? 'longer' : 'on_target',
  }
}
