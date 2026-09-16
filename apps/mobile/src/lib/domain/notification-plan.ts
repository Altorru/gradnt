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

export type WeeklySummary = {
  rides: number
  hours: number
  distanceKm: number
  elevationGainM: number
}

export type CelebrationRecord = Record<string, number>

type Base = { key: string; fireAt: Date }

export type DesiredNotification =
  | (Base & { kind: 'session'; workout: PlannedWorkout })
  | (Base & { kind: 'weekly'; summary: WeeklySummary | null })
  | (Base & { kind: 'inactivity' })
  | (Base & { kind: 'milestone'; threshold: MilestoneThreshold; progress: number })

export type PlanInput = {
  workouts: PlannedWorkout[]
  preferences: NotificationPreferences
  lastActivityAt: string | null
  lastSyncedAt: string | null
  weeklySummary: WeeklySummary | null
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

function sessionNotifications(input: PlanInput): DesiredNotification[] {
  const { preferences, now } = input

  if (!preferences.sessionReminder) {
    return []
  }

  return input.workouts
    .filter((workout) => workout.status === 'planned')
    .map((workout) => ({
      key: `session:${workout.id}`,
      kind: 'session' as const,
      workout,
      fireAt: fireAtOnDay(workout.date, preferences.reminderHour, preferences.reminderMinute),
    }))
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
 * The next Sunday evening, in local time.
 *
 * `WEEKLY_WEEKDAY` is Sunday in `expo-notifications` numbering, which runs 1..7
 * from Sunday — one off `Date.getDay()`, which runs 0..6 from Sunday. Hence the
 * `- 1`.
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

  const fresh = isFresh(input.lastSyncedAt, input.now)
  const fireAt = nextWeeklyFire(input.now)

  return [
    {
      key: `weekly:${fireAt.toISOString().slice(0, 10)}`,
      kind: 'weekly',
      summary: fresh ? input.weeklySummary : null,
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
      key: `inactivity:${lastActivityAt.slice(0, 10)}`,
      kind: 'inactivity',
      fireAt: nextDailyFire(now, preferences.reminderHour, preferences.reminderMinute),
    },
  ]
}

export function planNotifications(input: PlanInput): DesiredNotification[] {
  return [
    ...sessionNotifications(input),
    ...weeklyNotifications(input),
    ...inactivityNotifications(input),
  ].sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
}
