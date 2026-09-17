import type { WeeklyAvailabilityForm } from '../../features/onboarding/domain/availability.schema'
import type { CyclistGoalForm } from '../../features/onboarding/domain/goal.schema'
import type { CyclistProfileForm } from '../../features/onboarding/domain/profile.schema'

import {
  plannedWorkoutSchema,
  type PlannedWorkout,
  type TrainingPlan,
  type WorkoutType,
} from './schemas'

/** The first plan covers four weeks; its creation date is persisted. */
export const PLAN_WEEKS = 4

type PlanWeek = TrainingPlan['weeks'][number]

export type FirstPlanInput = {
  profile: CyclistProfileForm
  goal: CyclistGoalForm
  availability: WeeklyAvailabilityForm
  startDate: Date
  planId?: string
}

const weeklyVolumeMinutes = {
  lt3: 120,
  '3to6': 240,
  '6to10': 420,
  gt10: 600,
} as const

const weekdayIndex: Record<WeeklyAvailabilityForm[number]['day'], number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

/**
 * The three sessions a first week is built from, as bare types.
 *
 * Only the codes: the words live in the catalogue, keyed by these. A title
 * written into the plan here would be French for an English rider, and it would
 * stay French after they changed the language.
 */
const workoutTemplates = [
  { type: 'endurance' },
  { type: 'sweet_spot' },
  { type: 'recovery' },
] as const satisfies readonly { type: WorkoutType }[]

/** The types a first plan can produce, so the catalogue maps can be total. */
export type WorkoutTemplateType = (typeof workoutTemplates)[number]['type']

function getDaysUntilTarget(startDate: Date, targetDay: number): number {
  return (targetDay - startDate.getDay() + 7) % 7
}

function getNextDate(startDate: Date, targetDay: number): Date {
  const date = new Date(startDate)
  date.setDate(date.getDate() + getDaysUntilTarget(startDate, targetDay))
  date.setHours(7, 0, 0, 0)
  return date
}

function getIntensityTemplate(index: number, availableCount: number) {
  if (availableCount === 1 || index === 0) {
    return workoutTemplates[0]
  }

  if (availableCount >= 3 && index === availableCount - 1) {
    return workoutTemplates[2]
  }

  return workoutTemplates[1]
}

/**
 * One week of the plan, seven days on from the last.
 *
 * The volume cap is weekly — it is a share of the band the rider declared — so
 * it applies to each week rather than to the four together. Which is also why
 * the intensity progression restarts: a fresh week is not a continuation.
 */
function weekWorkouts(
  input: FirstPlanInput,
  availableSlots: FirstPlanInput['availability'],
  week: number,
): PlannedWorkout[] {
  const weekStart = new Date(input.startDate)
  weekStart.setDate(weekStart.getDate() + week * 7)

  const maxMinutes = Math.round(weeklyVolumeMinutes[input.profile.weeklyVolume] * 1.1)
  let scheduledMinutes = 0

  return availableSlots.reduce<PlannedWorkout[]>((workouts, slot, index) => {
    if (scheduledMinutes >= maxMinutes) {
      return workouts
    }

    const requestedMinutes = slot.durationMinutes ?? 45
    const durationMinutes = Math.min(requestedMinutes, maxMinutes - scheduledMinutes)

    if (durationMinutes < 45) {
      return workouts
    }

    const template = getIntensityTemplate(index, availableSlots.length)
    const date = getNextDate(weekStart, weekdayIndex[slot.day])

    const workout = plannedWorkoutSchema.parse({
      id: `${input.planId ?? 'first-plan'}-${week + 1}-${index + 1}`,
      date: date.toISOString(),
      type: template.type,
      durationMinutes,
      status: 'planned',
      goalType: input.goal.type,
    })

    scheduledMinutes += durationMinutes
    workouts.push(workout)
    return workouts
  }, [])
}

/** The weeks of a first plan, in the shape the schema models them. */
export function generateFirstPlan(input: FirstPlanInput): PlanWeek[] {
  const availableSlots = input.availability
    .filter((slot) => slot.available && slot.durationMinutes !== null)
    .sort(
      (left, right) =>
        getDaysUntilTarget(input.startDate, weekdayIndex[left.day]) -
        getDaysUntilTarget(input.startDate, weekdayIndex[right.day]),
    )

  return Array.from({ length: PLAN_WEEKS }, (_, week) => ({
    weekNumber: week + 1,
    workouts: weekWorkouts(input, availableSlots, week),
  }))
}
