import type { WeeklyAvailabilityForm } from '@/features/onboarding/domain/availability.schema'
import type { CyclistGoalForm } from '@/features/onboarding/domain/goal.schema'
import type { CyclistProfileForm } from '@/features/onboarding/domain/profile.schema'

import { plannedWorkoutSchema, type PlannedWorkout } from './schemas'

export type FirstPlanInput = {
  profile: CyclistProfileForm
  goal: CyclistGoalForm
  availability: WeeklyAvailabilityForm
  startDate: Date
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

const workoutTemplates = [
  {
    type: 'endurance' as const,
    title: 'Endurance fondamentale',
    intensityTarget: 'Facile',
    structure: 'Continu, conversation confortable',
  },
  {
    type: 'sweet_spot' as const,
    title: 'Sweet Spot',
    intensityTarget: '88–94 % FTP si disponible',
    structure: '3 × 8 min, récupération 5 min',
  },
  {
    type: 'recovery' as const,
    title: 'Récupération active',
    intensityTarget: 'Très facile',
    structure: 'Continu, cadence souple',
  },
]

function getNextDate(startDate: Date, targetDay: number): Date {
  const date = new Date(startDate)
  const currentDay = date.getDay()
  const daysUntilTarget = (targetDay - currentDay + 7) % 7
  date.setDate(date.getDate() + daysUntilTarget)
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

export function generateFirstPlan(input: FirstPlanInput): PlannedWorkout[] {
  const availableSlots = input.availability
    .filter((slot) => slot.available && slot.durationMinutes !== null)
    .sort((left, right) => weekdayIndex[left.day] - weekdayIndex[right.day])

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
    const date = getNextDate(input.startDate, weekdayIndex[slot.day])
    const goalReason =
      input.goal.type === 'fitness'
        ? 'Soutenir une progression régulière à partir de ton profil déclaré.'
        : `Prioriser ton objectif ${input.goal.type} sans dépasser ton volume déclaré.`

    const workout = plannedWorkoutSchema.parse({
      id: `first-plan-${index + 1}`,
      date: date.toISOString(),
      type: template.type,
      title: template.title,
      durationMinutes,
      intensityTarget: template.intensityTarget,
      structure: template.structure,
      status: 'planned',
      reason: `${goalReason} Jour choisi selon ta disponibilité récurrente.`,
    })

    scheduledMinutes += durationMinutes
    workouts.push(workout)
    return workouts
  }, [])
}
