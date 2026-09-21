import type { Activity, PlannedWorkout } from '@/lib/domain'

import type { FeedbackDraft } from './ride-feedback'

export type AdaptationProposal =
  | { kind: 'move'; workout: PlannedWorkout; newDate: string }
  | { kind: 'skip'; workout: PlannedWorkout }

function nextPlannedWorkout(workouts: PlannedWorkout[], after: string) {
  return workouts
    .filter((workout) => workout.status === 'planned' || workout.status === 'moved')
    .filter((workout) => Date.parse(workout.date) > Date.parse(after))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0]
}

/**
 * Produces a reviewable suggestion only. It never changes the plan itself.
 * A hard perceived effort or high fatigue moves the next session one day; a
 * missing/invalid date or already tracked workout produces no proposal.
 */
export function getAdaptationProposal(
  activity: Activity,
  feedback: FeedbackDraft,
  workouts: PlannedWorkout[],
): AdaptationProposal | null {
  const next = nextPlannedWorkout(workouts, activity.startAt)
  if (!next) return null

  const hard = feedback.fatigue === 'high' || (feedback.perceivedEffort ?? 0) >= 8
  if (!hard) return null

  const date = new Date(next.date)
  if (Number.isNaN(date.getTime())) return null
  date.setDate(date.getDate() + 1)
  return { kind: 'move', workout: next, newDate: date.toISOString() }
}
