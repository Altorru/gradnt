import type { MessageKey, Language, Translation } from '@/i18n'
import { formatNumber } from '@/i18n/format'

import type { NotificationPreferences } from '../../services/preferences/preferences.persistence'

import type { PlannedWorkout } from './schemas'

export const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

/** Beyond this, the data is too old to put a figure in a notification. */
export const FRESHNESS_WINDOW_MS = 24 * HOUR_MS

/** iOS silently drops pending local notifications past 64. Stay well clear. */
export const SCHEDULE_CAP = 20

export const INACTIVITY_DAYS = 4

/**
 * The weekly summary is fixed, not configured.
 *
 * The Settings section offers one hour — the session reminder's — because that
 * is the only one a rider organises a day around. Nobody schedules Sunday
 * around a summary.
 */
export const WEEKLY_HOUR = 18
export const WEEKLY_MINUTE = 0
/** Sunday in `expo-notifications` numbering, which runs 1..7 from Sunday. */
export const WEEKLY_WEEKDAY = 1

/** The progress levels worth telling a rider about, lowest first. */
export const MILESTONE_THRESHOLDS = [25, 50, 75, 100] as const
export type MilestoneThreshold = (typeof MILESTONE_THRESHOLDS)[number]

export type CelebrationRecord = Record<string, number>

/** When a repeating digest fires, in `expo-notifications` weekday numbering. */
export type WeeklyRepeat = { weekday: number; hour: number; minute: number }

type Base = { key: string; fireAt: Date }

export type DesiredNotification =
  | (Base & { kind: 'session'; workout: PlannedWorkout })
  | (Base & { kind: 'weekly'; repeat: WeeklyRepeat })
  | (Base & { kind: 'inactivity' })
  | (Base & { kind: 'milestone'; threshold: MilestoneThreshold; progress: number })

export type PlanInput = {
  workouts: PlannedWorkout[]
  preferences: NotificationPreferences
  lastActivityAt: string | null
  lastSyncedAt: string | null
  goal: { key: string; progress: number } | null
  celebrated: CelebrationRecord
  now: Date
}

/**
 * The hour the rider chose, on the calendar day the workout falls on.
 *
 * Built from local components rather than by adding milliseconds to the stored
 * instant: the stored instant is 07:00 UTC as often as not, and the rider means
 * seven o'clock where they are.
 */
function fireAtOnDay(workoutDate: string, hour: number, minute: number): Date {
  const day = new Date(workoutDate)

  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0)
}

/**
 * A key that carries when the notification fires, not only what it is about.
 *
 * Identity is the key alone, so a key naming just the session would let a rider
 * move their reminder from 07:00 to 14:30 and keep the 07:00 alarm until it
 * fired: the reconcile finds the key it already holds and leaves it alone. The
 * instant is therefore part of the identity — a reminder that moved is a
 * different reminder.
 *
 * The digest does not need it: its time is a constant, and its key already
 * carries the Sunday it lands on.
 */
function keyAt(prefix: string, subject: string, fireAt: Date): string {
  return `${prefix}:${subject}@${fireAt.toISOString()}`
}

function sessionNotifications(input: PlanInput): DesiredNotification[] {
  const { preferences, now } = input

  if (!preferences.sessionReminder) {
    return []
  }

  return input.workouts
    .filter((workout) => workout.status === 'planned')
    .map((workout) => {
      const fireAt = fireAtOnDay(workout.date, preferences.reminderHour, preferences.reminderMinute)

      return {
        key: keyAt('session', workout.id, fireAt),
        kind: 'session' as const,
        workout,
        fireAt,
      }
    })
    .filter((notification) => notification.fireAt > now)
}

/**
 * Whether the figures we hold were read recently enough to be quoted.
 *
 * A local notification carries only what the app knew when it was scheduled,
 * and Strava only syncs while the app is open. Past this window we cannot vouch
 * for a number, so we stop using numbers.
 */
export function isFresh(lastSyncedAt: string | null, now: Date): boolean {
  if (lastSyncedAt === null) {
    return false
  }

  const synced = Date.parse(lastSyncedAt)

  return !Number.isNaN(synced) && now.getTime() - synced < FRESHNESS_WINDOW_MS
}

/**
 * The digest, as a weekly repeat.
 *
 * The key carries the next Sunday rather than being fixed, and that is not
 * incidental: the two platforms hold it differently. iOS repeats a calendar
 * trigger for real. Expo's Android scheduling is a single exact alarm, never
 * rescheduled, and nothing removes it when it fires — so a key that never
 * changed would leave Android believing the digest was still pending and never
 * re-arm it, and the digest would ring once, ever.
 *
 * With the date in the key, Android re-arms on the next open exactly as the
 * date-only version did, and iOS gets the repeat it can actually deliver.
 *
 * Either way it cannot quote the week's figures: a body written a week before
 * it is read is unverifiable by then, which is the rule this planner keeps.
 */
/**
 * The next Sunday evening, in local time.
 *
 * `WEEKLY_WEEKDAY` is Sunday in `expo-notifications` numbering, which runs 1..7
 * from Sunday — one off `Date.getDay()`, which runs 0..6 from Sunday. Hence the
 * `- 1`.
 *
 * The instant is only used for the key and for Android's one-shot alarm; iOS
 * ignores it and repeats the weekday and time instead.
 */
function nextWeeklyFire(now: Date): Date {
  const fireAt = new Date(now)
  fireAt.setHours(WEEKLY_HOUR, WEEKLY_MINUTE, 0, 0)

  const daysUntil = (WEEKLY_WEEKDAY - 1 - fireAt.getDay() + 7) % 7
  fireAt.setDate(fireAt.getDate() + daysUntil)

  if (fireAt <= now) {
    fireAt.setDate(fireAt.getDate() + 7)
  }

  return fireAt
}

function weeklyNotifications(input: PlanInput): DesiredNotification[] {
  if (!input.preferences.weeklySummary) {
    return []
  }

  const fireAt = nextWeeklyFire(input.now)

  return [
    {
      key: `weekly:${fireAt.toISOString().slice(0, 10)}`,
      kind: 'weekly',
      repeat: { weekday: WEEKLY_WEEKDAY, hour: WEEKLY_HOUR, minute: WEEKLY_MINUTE },
      fireAt,
    },
  ]
}

/**
 * The next time the clock passes the rider's hour.
 *
 * The nudge is not fired the moment it is detected: an app that has just
 * noticed you were idle should not also interrupt you about it. It waits for
 * the hour the rider already nominated for hearing from us.
 */
function nextDailyFire(now: Date, hour: number, minute: number): Date {
  const fireAt = new Date(now)
  fireAt.setHours(hour, minute, 0, 0)

  if (fireAt <= now) {
    fireAt.setDate(fireAt.getDate() + 1)
  }

  return fireAt
}

function inactivityNotifications(input: PlanInput): DesiredNotification[] {
  const { preferences, lastActivityAt, lastSyncedAt, now } = input

  if (!preferences.inactivityNudge || lastActivityAt === null) {
    return []
  }

  // Without a recent sync we cannot tell idleness from not having looked.
  if (!isFresh(lastSyncedAt, now)) {
    return []
  }

  const idleMs = now.getTime() - Date.parse(lastActivityAt)

  if (Number.isNaN(idleMs) || idleMs < INACTIVITY_DAYS * DAY_MS) {
    return []
  }

  return [
    {
      // Derived from the last ride, not from `now`, so successive reconciles
      // agree on the key. A fired notification leaves the pending list, so an
      // idle rider who keeps opening the app is nudged at most once per launch.
      // ponytail: no persisted "nudged" flag; the spec asks for deterministic
      // keys, not once-per-stretch.
      key: keyAt(
        'inactivity',
        lastActivityAt.slice(0, 10),
        nextDailyFire(now, preferences.reminderHour, preferences.reminderMinute),
      ),
      kind: 'inactivity',
      fireAt: nextDailyFire(now, preferences.reminderHour, preferences.reminderMinute),
    },
  ]
}

function milestoneNotifications(input: PlanInput): DesiredNotification[] {
  const { goal, celebrated, now } = input

  if (goal === null) {
    return []
  }

  const reached = MILESTONE_THRESHOLDS.filter((threshold) => goal.progress >= threshold)
  const highest = reached.at(-1)

  if (highest === undefined || (celebrated[goal.key] ?? 0) >= highest) {
    return []
  }

  return [
    {
      key: `milestone:${goal.key}:${highest}`,
      kind: 'milestone',
      threshold: highest,
      progress: goal.progress,
      fireAt: now,
    },
  ]
}

/**
 * Everything that should be scheduled, capped.
 *
 * iOS drops pending local notifications past 64 without saying so, and a plan
 * of several weeks clears that on its own. We keep the soonest, because a
 * reminder three weeks out is the one a rider can most afford to lose.
 *
 * Milestones are exempt: they fire now, not later, and a cap that swallowed the
 * one notification the rider did something to earn would be the worst possible
 * thing to drop.
 */
export function planNotifications(input: PlanInput): DesiredNotification[] {
  const all = [
    ...sessionNotifications(input),
    ...weeklyNotifications(input),
    ...inactivityNotifications(input),
    ...milestoneNotifications(input),
  ]

  const immediate = all.filter((notification) => notification.fireAt <= input.now)
  const later = all
    .filter((notification) => notification.fireAt > input.now)
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())

  const room = Math.max(0, SCHEDULE_CAP - immediate.length)

  return [...immediate, ...later.slice(0, room)]
}

/** The workout type, as a catalogue key. Never `workout.title`. */
const SESSION_TITLE_KEYS = {
  endurance: 'notifications.session.endurance',
  tempo: 'notifications.session.tempo',
  sweet_spot: 'notifications.session.sweetSpot',
  threshold: 'notifications.session.threshold',
  vo2_max: 'notifications.session.vo2Max',
  recovery: 'notifications.session.recovery',
} as const satisfies Record<PlannedWorkout['type'], MessageKey>

export type NotificationWording = {
  title: string
  body: string
  /** Where a tap lands. */
  url: string
}

/**
 * The words a notification will carry, in the language it is handed.
 *
 * Written here, at scheduling time, and copied into the notification: a local
 * notification is not rendered by the app, so a language change has to
 * re-trigger reconciliation rather than re-render.
 *
 * Every figure goes through `formatNumber` before it reaches a template, since
 * `interpolate` only does `String(value)`: a raw 6.5 would reach a French lock
 * screen as "6.5 h", where French writes "6,5 h". The words come from the
 * catalogue; the numbers come from the formatter.
 */
export function describeNotification(
  notification: DesiredNotification,
  { t }: Translation,
  language: Language,
): NotificationWording {
  switch (notification.kind) {
    case 'session':
      return {
        title: t('notifications.session.title'),
        body: `${t(SESSION_TITLE_KEYS[notification.workout.type])} · ${t(
          'notifications.session.duration',
          { minutes: formatNumber(language, notification.workout.durationMinutes) },
        )}`,
        url: `/plan/${notification.workout.id}`,
      }

    case 'weekly':
      return {
        title: t('notifications.weekly.title'),
        // Always the figure-free wording: the digest repeats, so its body is
        // written once and read weeks later.
        body: t('notifications.weekly.bodyWithoutFigures'),
        url: '/progress',
      }

    case 'inactivity':
      return {
        title: t('notifications.inactivity.title'),
        body: t('notifications.inactivity.body'),
        // The nudge has no screen of its own; it lands the rider on home.
        url: '/home',
      }

    case 'milestone':
      return {
        title: t('notifications.milestone.title'),
        body: t('notifications.milestone.body', {
          threshold: formatNumber(language, notification.threshold),
        }),
        url: '/progress',
      }
  }
}
