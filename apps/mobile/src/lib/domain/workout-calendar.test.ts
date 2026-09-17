import { describe, expect, it } from 'vitest'

import { getNextWorkout } from './selectors'
import { getCurrentWeekWorkouts, groupWorkoutsByWeek } from './workout-calendar'
import type { PlannedWorkout } from './schemas'

function workout(
  id: string,
  date: Date,
  status: PlannedWorkout['status'] = 'planned',
): PlannedWorkout {
  return {
    id,
    date: date.toISOString(),
    status,
    type: 'endurance',
    durationMinutes: 60,
    goalType: null,
  }
}

describe('next action and calendar weeks', () => {
  const now = new Date(2026, 8, 17, 18)
  it('includes today after the default time and sorts moved sessions chronologically', () => {
    const items = [
      workout('later', new Date(2026, 8, 20, 7)),
      workout('past', new Date(2026, 8, 16, 7)),
      workout('today', new Date(2026, 8, 17, 7), 'moved'),
      workout('done', new Date(2026, 8, 17, 6), 'completed'),
    ]
    expect(getNextWorkout(items, now)?.id).toBe('today')
    expect(items[0].id).toBe('later')
  })
  it('has no next action for only past or skipped sessions', () => {
    expect(
      getNextWorkout(
        [
          workout('past', new Date(2026, 8, 10)),
          workout('skipped', new Date(2026, 8, 18), 'skipped'),
        ],
        now,
      ),
    ).toBeNull()
  })
  it('counts actual Monday-to-Sunday dates, not the first generated week', () => {
    const items = [
      workout('previous', new Date(2026, 8, 13, 23)),
      workout('monday', new Date(2026, 8, 14)),
      workout('sunday', new Date(2026, 8, 20, 23)),
      workout('next', new Date(2026, 8, 21)),
    ]
    expect(getCurrentWeekWorkouts(items, now).map((item) => item.id)).toEqual(['monday', 'sunday'])
  })
  it('groups a moved session into its real week without losing it', () => {
    const groups = groupWorkoutsByWeek([
      workout('late', new Date(2026, 8, 22), 'moved'),
      workout('early', new Date(2026, 8, 15)),
    ])
    expect(groups.map((week) => week.workouts.map((item) => item.id))).toEqual([
      ['early'],
      ['late'],
    ])
  })
})
