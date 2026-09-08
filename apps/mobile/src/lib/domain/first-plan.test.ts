import { describe, expect, it } from 'vitest'

import {
  defaultWeeklyAvailability,
  type WeeklyAvailabilityForm,
} from '../../features/onboarding/domain/availability.schema'
import type { CyclistGoalForm } from '../../features/onboarding/domain/goal.schema'
import type { CyclistProfileForm } from '../../features/onboarding/domain/profile.schema'

import { generateFirstPlan } from './first-plan'

const profile: CyclistProfileForm = {
  discipline: 'road',
  experience: 'regular',
  weeklyVolume: '3to6',
}

const goal: CyclistGoalForm = {
  type: 'fitness',
  targetValue: '',
  eventName: '',
}

const startDate = new Date('2026-09-12T10:00:00.000Z')

function withAvailability(
  slots: Partial<WeeklyAvailabilityForm[number]>[],
): WeeklyAvailabilityForm {
  return defaultWeeklyAvailability.map((slot, index) => ({
    ...slot,
    ...slots[index],
  }))
}

describe('generateFirstPlan', () => {
  it('schedules only available days and keeps their requested durations', () => {
    const availability = withAvailability([
      { available: true, durationMinutes: 45 },
      { available: false, durationMinutes: null },
      { available: true, durationMinutes: 90 },
      { available: false, durationMinutes: null },
      { available: false, durationMinutes: null },
      { available: false, durationMinutes: null },
      { available: false, durationMinutes: null },
    ])

    const workouts = generateFirstPlan({ profile, goal, availability, startDate })

    expect(workouts).toHaveLength(2)
    expect(workouts.map((workout) => workout.durationMinutes)).toEqual([45, 90])
    expect(workouts.every((workout) => workout.status === 'planned')).toBe(true)
  })

  it('caps generated volume at 110 percent of the declared weekly band', () => {
    const availability = defaultWeeklyAvailability.map((slot) => ({
      ...slot,
      available: true,
      durationMinutes: 120,
    }))

    const workouts = generateFirstPlan({ profile, goal, availability, startDate })
    const totalMinutes = workouts.reduce((total, workout) => total + workout.durationMinutes, 0)

    expect(totalMinutes).toBeLessThanOrEqual(264)
    expect(workouts.every((workout) => workout.durationMinutes >= 45)).toBe(true)
  })

  it('uses an easy, quality, recovery progression across three available days', () => {
    const availability = defaultWeeklyAvailability.map((slot, index) => ({
      ...slot,
      available: index < 3,
      durationMinutes: index < 3 ? 60 : null,
    }))

    const workouts = generateFirstPlan({ profile, goal, availability, startDate })

    expect(workouts.map((workout) => workout.type)).toEqual(['endurance', 'sweet_spot', 'recovery'])
  })

  it('orders days from the start date rather than from Monday', () => {
    const availability = withAvailability([
      { available: true, durationMinutes: 60 },
      { available: false, durationMinutes: null },
      { available: false, durationMinutes: null },
      { available: false, durationMinutes: null },
      { available: false, durationMinutes: null },
      { available: true, durationMinutes: 60 },
      { available: false, durationMinutes: null },
    ])

    const workouts = generateFirstPlan({ profile, goal, availability, startDate })

    expect(workouts.map((workout) => workout.id)).toEqual(['first-plan-1', 'first-plan-2'])
    expect(new Date(workouts[0]?.date ?? '').getUTCDay()).toBe(6)
    expect(new Date(workouts[1]?.date ?? '').getUTCDay()).toBe(1)
  })
})
