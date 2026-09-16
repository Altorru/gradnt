import { describe, expect, it, vi } from 'vitest'
import type { PlannedWorkout } from './schemas'
import {
  FRESHNESS_WINDOW_MS,
  isFresh,
  planNotifications,
  type PlanInput,
} from './notification-plan'

// Hoisted above the import by vitest, so the module under test sees the stubs.
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}))

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

describe('weekly summary', () => {
  const summary = { rides: 4, hours: 6.5, distanceKm: 142, elevationGainM: 850 }

  it('carries the figures while the data is fresh', () => {
    const result = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: summary,
        lastSyncedAt: new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('weekly')
    expect(result[0]).toMatchObject({ summary })
  })

  it('drops the figures once the data is stale, rather than showing last week', () => {
    const result = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: summary,
        lastSyncedAt: new Date(NOW.getTime() - 30 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result[0]).toMatchObject({ summary: null })
  })

  it('drops the figures when nothing was ever synced', () => {
    const result = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: summary,
        lastSyncedAt: null,
      }),
    )

    expect(result[0]).toMatchObject({ summary: null })
  })

  it('lands on the next Sunday evening', () => {
    const result = planNotifications(
      input({ preferences: { ...input().preferences, weeklySummary: true } }),
    )

    expect(result[0].fireAt.getDay()).toBe(0) // Sunday
    expect(result[0].fireAt.getHours()).toBe(18)
  })
})

describe('isFresh', () => {
  it('treats a missing sync as stale', () => {
    expect(isFresh(null, NOW)).toBe(false)
  })

  it('holds for just under the window and fails at it', () => {
    const justInside = new Date(NOW.getTime() - FRESHNESS_WINDOW_MS + 1000).toISOString()
    const atTheEdge = new Date(NOW.getTime() - FRESHNESS_WINDOW_MS).toISOString()

    expect(isFresh(justInside, NOW)).toBe(true)
    expect(isFresh(atTheEdge, NOW)).toBe(false)
  })
})

describe('inactivity nudge', () => {
  const enabled = { ...input().preferences, inactivityNudge: true }
  const fresh = new Date(NOW.getTime() - 60 * 60 * 1000).toISOString()

  it('stays quiet about a rider who rode yesterday', () => {
    const result = planNotifications(
      input({
        preferences: enabled,
        lastSyncedAt: fresh,
        lastActivityAt: new Date(NOW.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(0)
  })

  it('speaks up after four days without a ride', () => {
    const result = planNotifications(
      input({
        preferences: enabled,
        lastSyncedAt: fresh,
        lastActivityAt: new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(1)
    expect(result[0].kind).toBe('inactivity')
  })

  it('stays quiet on stale data, because it cannot know whether he rode', () => {
    const result = planNotifications(
      input({
        preferences: enabled,
        lastSyncedAt: new Date(NOW.getTime() - 30 * 60 * 60 * 1000).toISOString(),
        lastActivityAt: new Date(NOW.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    expect(result).toHaveLength(0)
  })

  it('says nothing when the rider never rode at all', () => {
    const result = planNotifications(
      input({ preferences: enabled, lastSyncedAt: fresh, lastActivityAt: null }),
    )

    expect(result).toHaveLength(0)
  })

  it('keys the nudge on the last ride, so successive reconciles agree', () => {
    const lastActivityAt = new Date(NOW.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const plan = () =>
      planNotifications(input({ preferences: enabled, lastSyncedAt: fresh, lastActivityAt }))

    const first = plan()
    const second = plan()

    expect(first[0].key).toBe(second[0].key)
    expect(first[0].key).toBe(`inactivity:${lastActivityAt.slice(0, 10)}`)
  })
})
