import type { NotificationPreferences } from '../../services/preferences/preferences.persistence'

import type { PlannedWorkout } from './schemas'

const DAY_MS = 24 * 60 * 60 * 1000
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

export function planNotifications(input: PlanInput): DesiredNotification[] {
  return [...sessionNotifications(input)].sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
}
