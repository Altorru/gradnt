import { describe, expect, it, vi } from 'vitest'

// Hoisted above the import by vitest, so the module under test sees the stubs.
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}))

import type { PlannedWorkout } from './schemas'
import { planNotifications, type PlanInput } from './notification-plan'

const NOW = new Date('2026-09-16T06:00:00.000Z') // a Wednesday

function workout(over: Partial<PlannedWorkout> = {}): PlannedWorkout {
  return {
    id: 'w1',
    date: '2026-09-17T07:00:00.000Z',
    type: 'endurance',
    title: 'Endurance fondamentale',
    durationMinutes: 90,
    intensityTarget: 'Facile',
    structure: 'Continu',
    status: 'planned',
    reason: 'Base',
    ...over,
  }
}

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    workouts: [],
    preferences: {
      language: 'system',
      appearance: 'system',
      sessionReminder: true,
      reminderHour: 7,
      reminderMinute: 0,
      weeklySummary: false,
      inactivityNudge: false,
    },
    lastActivityAt: null,
    lastSyncedAt: null,
    weeklySummary: null,
    goal: null,
    celebrated: {},
    now: NOW,
    ...over,
  }
}

describe('session reminders', () => {
  it('fires on the day of the session, at the hour the rider chose', () => {
    const result = planNotifications(input({ workouts: [workout()] }))

    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('session:w1')
    expect(result[0].fireAt.getHours()).toBe(7)
    expect(result[0].fireAt.getMinutes()).toBe(0)
  })

  it('says nothing about a session already completed, skipped or moved', () => {
    for (const status of ['completed', 'skipped', 'moved'] as const) {
      const result = planNotifications(input({ workouts: [workout({ status })] }))
      expect(result, status).toHaveLength(0)
    }
  })

  it('says nothing about a session in the past', () => {
    const result = planNotifications(
      input({ workouts: [workout({ date: '2026-09-15T07:00:00.000Z' })] }),
    )

    expect(result).toHaveLength(0)
  })

  it('says nothing at all when the rider turned reminders off', () => {
    const result = planNotifications(
      input({
        workouts: [workout()],
        preferences: { ...input().preferences, sessionReminder: false },
      }),
    )

    expect(result).toHaveLength(0)
  })
})
