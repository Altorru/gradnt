import type { CyclistState } from './cyclist-state'
import type { WorkoutType } from './schemas'

const declaredWeeklyMinutes = {
  lt3: 120,
  '3to6': 240,
  '6to10': 420,
  gt10: 600,
} as const

export type PlanPrescription = {
  weeklyMinutes: number
  firstWorkoutType: WorkoutType
  rationale: 'declared_baseline' | 'observed_baseline' | 'recovery'
}

/**
 * Turns the observed cyclist state into conservative plan inputs. The plan
 * remains bounded by the availability calendar; this function only chooses a
 * credible weekly budget and whether the block must begin with recovery.
 */
export function getPlanPrescription(
  weeklyVolume: keyof typeof declaredWeeklyMinutes,
  state: CyclistState | null,
): PlanPrescription {
  const declared = declaredWeeklyMinutes[weeklyVolume]
  if (state === null || state.data.activityCount < 3 || state.volume.last28DaysRides < 3) {
    return {
      weeklyMinutes: declared,
      firstWorkoutType: 'endurance',
      rationale: 'declared_baseline',
    }
  }

  const observed = Math.round((state.volume.last28DaysHours / 4) * 60)
  const boundedObserved = Math.min(declared * 1.15, Math.max(declared * 0.6, observed))
  if (state.recommendation === 'recover') {
    return {
      weeklyMinutes: Math.round(boundedObserved * 0.7),
      firstWorkoutType: 'recovery',
      rationale: 'recovery',
    }
  }

  return {
    weeklyMinutes: Math.round(boundedObserved),
    firstWorkoutType: 'endurance',
    rationale: 'observed_baseline',
  }
}
