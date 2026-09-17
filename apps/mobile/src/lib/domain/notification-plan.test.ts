import { describe, expect, it, vi } from 'vitest'

// The leaf module, not `@/i18n`: the barrel pulls in the preferences store and
// with it expo-secure-store, which a domain test has no business loading.
import { translate, translatePlural } from '@/i18n/translate'

import type { PlannedWorkout } from './schemas'
import {
  describeNotification,
  FRESHNESS_WINDOW_MS,
  isFresh,
  planNotifications,
  SCHEDULE_CAP,
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
      celebratedThresholds: {},
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

describe('goal milestones', () => {
  const goal = { key: 'goal-1', progress: 78 }

  it('celebrates the highest level reached', () => {
    const result = planNotifications(input({ goal }))

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ kind: 'milestone', threshold: 75, progress: 78 })
  })

  it('never celebrates the same level twice', () => {
    const first = planNotifications(input({ goal }))
    const celebrated = { 'goal-1': 75 }

    const second = planNotifications(input({ goal, celebrated }))

    expect(first).toHaveLength(1)
    expect(second).toHaveLength(0)
  })

  it('still celebrates a level further up', () => {
    const result = planNotifications(
      input({ goal: { key: 'goal-1', progress: 100 }, celebrated: { 'goal-1': 75 } }),
    )

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ threshold: 100 })
  })

  it('says nothing below the first level', () => {
    expect(planNotifications(input({ goal: { key: 'goal-1', progress: 12 } }))).toHaveLength(0)
  })
})

describe('the scheduling cap', () => {
  it('keeps the soonest and drops the rest', () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      workout({
        id: `w${index}`,
        date: new Date(NOW.getTime() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    const result = planNotifications(input({ workouts: many }))

    expect(result).toHaveLength(SCHEDULE_CAP)
    expect(result[0].key).toBe('session:w0')
  })

  it('never drops a milestone, which fires now rather than later', () => {
    const many = Array.from({ length: 30 }, (_, index) =>
      workout({
        id: `w${index}`,
        date: new Date(NOW.getTime() + (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )

    const result = planNotifications(
      input({ workouts: many, goal: { key: 'goal-1', progress: 50 } }),
    )

    expect(result.filter((n) => n.kind === 'milestone')).toHaveLength(1)
  })
})

const frTranslation = {
  t: (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate('fr', key, params),
  plural: (key: Parameters<typeof translatePlural>[1], count: number) =>
    translatePlural('fr', key, count),
}
const enTranslation = {
  t: (key: Parameters<typeof translate>[1], params?: Parameters<typeof translate>[2]) =>
    translate('en', key, params),
  plural: (key: Parameters<typeof translatePlural>[1], count: number) =>
    translatePlural('en', key, count),
}

describe('describeNotification', () => {
  it('names the session type from the code, never from the stored French title', () => {
    const notification = planNotifications(input({ workouts: [workout()] }))[0]

    const wording = describeNotification(notification, enTranslation, 'en')

    expect(wording.body).toContain('Endurance')
    expect(wording.body).not.toContain('fondamentale')
  })

  it('writes in the language it is handed', () => {
    const notification = planNotifications(input({ workouts: [workout()] }))[0]

    expect(describeNotification(notification, frTranslation, 'fr').title).not.toBe(
      describeNotification(notification, enTranslation, 'en').title,
    )
  })

  it('deep links a session to its own screen', () => {
    const notification = planNotifications(input({ workouts: [workout()] }))[0]

    expect(describeNotification(notification, frTranslation, 'fr').url).toBe('/plan/w1')
  })

  it('writes the weekly figures the way the rider’s language writes numbers', () => {
    const notification = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: { rides: 4, hours: 6.5, distanceKm: 142, elevationGainM: 850 },
        lastSyncedAt: new Date(NOW.getTime() - 60 * 1000).toISOString(),
      }),
    )[0]

    expect(describeNotification(notification, frTranslation, 'fr').body).toContain('6,5')
    expect(describeNotification(notification, enTranslation, 'en').body).toContain('6.5')
  })

  it('has two weekly wordings, and uses the one the data allows', () => {
    const fresh = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: { rides: 4, hours: 6.5, distanceKm: 142, elevationGainM: 850 },
        lastSyncedAt: new Date(NOW.getTime() - 60 * 1000).toISOString(),
      }),
    )[0]
    const stale = planNotifications(
      input({
        preferences: { ...input().preferences, weeklySummary: true },
        weeklySummary: { rides: 4, hours: 6.5, distanceKm: 142, elevationGainM: 850 },
        lastSyncedAt: null,
      }),
    )[0]

    expect(describeNotification(fresh, frTranslation, 'fr').body).toContain('4')
    expect(describeNotification(stale, frTranslation, 'fr').body).not.toContain('4')
  })

  it('deep links a nudge to the home screen, the only screen it has', () => {
    const notification = planNotifications(
      input({
        preferences: { ...input().preferences, inactivityNudge: true },
        lastSyncedAt: new Date(NOW.getTime() - 60 * 1000).toISOString(),
        lastActivityAt: new Date(NOW.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    )[0]

    expect(describeNotification(notification, frTranslation, 'fr').url).toBe('/home')
  })
})
