import { describe, expect, it } from 'vitest'

import {
  defaultWeeklyAvailability,
  type WeeklyAvailabilityForm,
} from '../../features/onboarding/domain/availability.schema'
import type { CyclistGoalForm } from '../../features/onboarding/domain/goal.schema'
import type { CyclistProfileForm } from '../../features/onboarding/domain/profile.schema'

import { generateFirstPlan, PLAN_WEEKS } from './first-plan'

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

/** The first week, which is the one every per-week claim below is about. */
function firstWeek(availability: WeeklyAvailabilityForm = defaultWeeklyAvailability) {
  return generateFirstPlan({ profile, goal, availability, startDate })[0].workouts
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

    const workouts = firstWeek(availability)

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

    const workouts = firstWeek(availability)
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

    expect(firstWeek(availability).map((workout) => workout.type)).toEqual([
      'endurance',
      'sweet_spot',
      'recovery',
    ])
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

    const workouts = firstWeek(availability)

    expect(workouts.map((workout) => workout.id)).toEqual(['first-plan-1-1', 'first-plan-1-2'])
    expect(new Date(workouts[0]?.date ?? '').getUTCDay()).toBe(6)
    expect(new Date(workouts[1]?.date ?? '').getUTCDay()).toBe(1)
  })

  /**
   * Four weeks, not one.
   *
   * The plan is regenerated from the onboarding snapshot on every read, so a
   * week of it exists only until the next read — which only happens when the app
   * is opened. A reminder cannot outlive the plan that produced it, so the plan
   * reaches further than a rider's gap between opens.
   */
  it('writes several weeks ahead, a week apart', () => {
    const weeks = generateFirstPlan({
      profile,
      goal,
      availability: defaultWeeklyAvailability,
      startDate,
    })

    expect(weeks).toHaveLength(PLAN_WEEKS)
    expect(weeks.map((week) => week.weekNumber)).toEqual([1, 2, 3, 4])

    // Every week carries the same pattern, shifted seven days.
    for (const week of weeks) {
      expect(week.workouts).toHaveLength(3)
    }

    const first = Date.parse(weeks[0].workouts[0].date)
    const second = Date.parse(weeks[1].workouts[0].date)

    expect(Math.round((second - first) / (24 * 60 * 60 * 1000))).toBe(7)
  })

  it('numbers a session by its week and its slot, not by its date', () => {
    const weeks = generateFirstPlan({
      profile,
      goal,
      availability: defaultWeeklyAvailability,
      startDate,
    })

    expect(weeks[1].workouts.map((workout) => workout.id)).toEqual([
      'first-plan-2-1',
      'first-plan-2-2',
      'first-plan-2-3',
    ])
  })

  /**
   * Codes only. The words come from the catalogue, keyed by `type`.
   *
   * A title stored at generation time is written in whatever language was
   * active then, and it stays that way after the rider changes it — which is
   * what the plan list, the session screen and the home card all rendered.
   */
  it('stores no wording of its own, so the plan reads in any language', () => {
    const [workout] = firstWeek()

    expect(Object.keys(workout ?? {}).sort()).toEqual([
      'date',
      'durationMinutes',
      'goalType',
      'id',
      'status',
      'type',
    ])
  })

  it('records the goal a session serves, as a code', () => {
    const [workout] = generateFirstPlan({
      profile,
      goal: { ...goal, type: 'climbing', targetValue: '2000' },
      availability: defaultWeeklyAvailability,
      startDate,
    })[0].workouts

    expect(workout?.goalType).toBe('climbing')
  })

  it('plans nothing when no day is available', () => {
    const weeks = generateFirstPlan({
      profile,
      goal,
      availability: defaultWeeklyAvailability.map((slot) => ({
        ...slot,
        available: false,
        durationMinutes: null,
      })),
      startDate,
    })

    expect(weeks.flatMap((week) => week.workouts)).toEqual([])
  })
})
