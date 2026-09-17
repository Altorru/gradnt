import type { Translate } from '@/i18n'
import type { GoalType, WorkoutType } from '@/lib/domain/schemas'

/**
 * The words for a session, derived from its type rather than stored with it.
 *
 * The keys are built from the type, so they stay total without a map to keep in
 * step: `MessageKey` is the union of the catalogue's real paths, and a type with
 * no entry under `workouts` fails to compile rather than rendering blank.
 */
export function workoutTitle(t: Translate, type: WorkoutType): string {
  return t(`workouts.titles.${type}`)
}

export function workoutIntensity(t: Translate, type: WorkoutType): string {
  return t(`workouts.intensity.${type}`)
}

export function workoutStructure(t: Translate, type: WorkoutType): string {
  return t(`workouts.structure.${type}`)
}

/**
 * Why the session is on that day.
 *
 * Two sentences, not one per goal: a rider training for an event and a rider
 * training for a distance want the same thing said, and only the goal's name
 * changes. Fitness is the exception — it is the goal that names nothing to
 * prioritise.
 */
export function workoutReason(t: Translate, goalType: GoalType | null): string {
  if (goalType === null || goalType === 'fitness') {
    return t('workouts.reasons.fitness')
  }

  return t('workouts.reasons.goal', { goal: t(`onboarding.goalLabels.${goalType}`) })
}

/** A duration a rider reads, not a number of minutes. */
export function formatWorkoutDuration(durationMinutes: number): string {
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes}`
}
