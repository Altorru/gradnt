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
    durationMinutes: 90,
    status: 'planned',
    goalType: 'fitness',
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
    goal: null,
    celebrated: {},
    now: NOW,
    ...over,
  }
}

describe('session reminders', () => {
  it('fires on the day of the session, at the hour the rider chose', () => {
    const result = planNotifications(input({ workouts: [workout()] }))

    const [reminder] = result

    expect(reminder).toMatchObject({ kind: 'session' })
    // The instant is in the key too, which is what makes moving the hour take.
    expect(reminder?.key.startsWith('session:w1@')).toBe(true)
    // `in`, because the digest in this union has no instant to read.
    expect('fireAt' in reminder && reminder.fireAt.getHours()).toBe(7)
    expect('fireAt' in reminder && reminder.fireAt.getMinutes()).toBe(0)
  })

  /**
   * The bug this key shape exists to prevent.
   *
   * With the instant left out, a rider who moved their reminder from 07:00 to
   * 14:30 kept the 07:00 alarm: the reconcile found the key it already held and
   * left it alone, so the change took effect only once the old one had fired.
   */
  it('gives a moved reminder a different key, so the old alarm is replaced', () => {
    const atSeven = planNotifications(input({ workouts: [workout()] }))[0]
    const atFourteen = planNotifications(
      input({
        workouts: [workout()],
        preferences: { ...input().preferences, reminderHour: 14, reminderMinute: 30 },
      }),
    )[0]

    expect(atFourteen.key).not.toBe(atSeven.key)
  })

  it('says nothing about a session already completed or skipped', () => {
    for (const status of ['completed', 'skipped'] as const) {
      const result = planNotifications(input({ workouts: [workout({ status })] }))
      expect(result, status).toHaveLength(0)
    }
  })

  it('schedules the session reminder after a workout is moved', () => {
    const result = planNotifications(input({ workouts: [workout({ status: 'moved' })] }))
    expect(result.find((notification) => notification.kind === 'session')).toBeDefined()
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

describe('the weekly digest', () => {
  const on = { preferences: { ...input().preferences, weeklySummary: true } }

  it('is a weekly repeat, landing on the next Sunday evening', () => {
    const result = planNotifications(input(on))

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      kind: 'weekly',
      // Sunday, in `expo-notifications` numbering where 1 is Sunday.
      repeat: { weekday: 1, hour: 18, minute: 0 },
    })
    expect(result[0].fireAt.getDay()).toBe(0)
    expect(result[0].fireAt.getHours()).toBe(18)
  })

  /**
   * The key moves with the date, and that is what makes Android work.
   *
   * Expo's Android alarm is a single one that is never rescheduled, and nothing
   * removes it from the store when it fires — so a key that never changed would
   * be read as still pending and never re-armed, and the digest would ring once,
   * ever. A key per Sunday also lets the reconcile cancel the entry it replaced.
   */
  it('changes key with the Sunday, so the entry it replaced is not kept', () => {
    const thisWeek = planNotifications(input(on))[0]
    const nextWeek = planNotifications(
      input({ ...on, now: new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000) }),
    )[0]

    expect(thisWeek.key).toMatch(/^weekly:\d{4}-\d{2}-\d{2}$/)
    expect(nextWeek.key).not.toBe(thisWeek.key)
  })

  it('is gone when the rider turned it off', () => {
    expect(planNotifications(input())).toEqual([])
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
    expect(first[0].key.startsWith(`inactivity:${lastActivityAt.slice(0, 10)}@`)).toBe(true)
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
    expect(result[0].key.startsWith('session:w0@')).toBe(true)
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

  it('words the digest without figures, which it cannot vouch for a week later', () => {
    const notification = planNotifications(
      input({ preferences: { ...input().preferences, weeklySummary: true } }),
    )[0]

    const body = describeNotification(notification, frTranslation, 'fr').body

    expect(body).not.toMatch(/\d/)
    expect(describeNotification(notification, enTranslation, 'en').body).not.toMatch(/\d/)
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
