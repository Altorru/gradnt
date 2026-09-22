import type { Activity } from './schemas'

const DAY_MS = 24 * 60 * 60 * 1000

export type CyclistState = {
  asOf: string
  data: {
    activityCount: number
    firstActivityAt: string | null
    latestActivityAt: string | null
  }
  volume: {
    last7DaysHours: number
    last28DaysHours: number
    last84DaysHours: number
    last7DaysRides: number
    last28DaysRides: number
  }
  load: {
    last7Days: number
    last28Days: number
    /** Current seven-day load divided by the recent four-week weekly average. */
    acuteToChronicRatio: number | null
  }
  intensity: {
    last7DaysHardRides: number
    last7DaysHardMinutes: number
  }
  trend: 'insufficient_data' | 'reduced' | 'steady' | 'increasing'
  recommendation: 'recover' | 'maintain' | 'progress'
}

type Window = { hours: number; rides: number; load: number; hardRides: number; hardMinutes: number }

function round(value: number, digits = 1): number {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

function isInWindow(startAt: string, now: Date, days: number): boolean {
  const timestamp = Date.parse(startAt)
  return (
    Number.isFinite(timestamp) &&
    timestamp <= now.getTime() &&
    timestamp > now.getTime() - days * DAY_MS
  )
}

function rideLoad(activity: Activity, ftp: number | null): number {
  const power = activity.normalizedPower ?? activity.weightedPower ?? activity.averagePower
  const factor = power !== null && ftp !== null && ftp > 0 ? power / ftp : 1
  return (activity.durationSeconds / 3600) * 100 * factor ** 2
}

function isHard(activity: Activity, ftp: number | null): boolean {
  const power = activity.normalizedPower ?? activity.weightedPower ?? activity.averagePower
  if (power !== null && ftp !== null && ftp > 0) return power / ftp >= 0.9
  return activity.durationSeconds >= 2 * 60 * 60
}

function windowFor(activities: Activity[], now: Date, days: number, ftp: number | null): Window {
  return activities.reduce<Window>(
    (window, activity) => {
      if (!isInWindow(activity.startAt, now, days)) return window
      const hard = isHard(activity, ftp)
      return {
        hours: window.hours + activity.durationSeconds / 3600,
        rides: window.rides + 1,
        load: window.load + rideLoad(activity, ftp),
        hardRides: window.hardRides + (hard ? 1 : 0),
        hardMinutes: window.hardMinutes + (hard ? activity.durationSeconds / 60 : 0),
      }
    },
    { hours: 0, rides: 0, load: 0, hardRides: 0, hardMinutes: 0 },
  )
}

/**
 * A small, explainable representation of the rider's current training state.
 * It uses only normalized GRADNT activities and deliberately avoids medical
 * claims: the result guides a training decision, it does not diagnose fatigue.
 */
export function getCyclistState(
  activities: Activity[],
  ftp: number | null,
  now: Date = new Date(),
): CyclistState {
  const sorted = [...activities]
    .filter((activity) => Number.isFinite(Date.parse(activity.startAt)))
    .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt))
  const last7 = windowFor(sorted, now, 7, ftp)
  const last28 = windowFor(sorted, now, 28, ftp)
  const last84 = windowFor(sorted, now, 84, ftp)
  const previous7 = windowFor(
    sorted.filter((activity) => {
      const timestamp = Date.parse(activity.startAt)
      return timestamp <= now.getTime() - 7 * DAY_MS && timestamp > now.getTime() - 14 * DAY_MS
    }),
    new Date(now.getTime() - 7 * DAY_MS),
    7,
    ftp,
  )

  const chronicWeeklyLoad = last28.load / 4
  const ratio = chronicWeeklyLoad > 0 && last28.rides >= 3 ? last7.load / chronicWeeklyLoad : null
  const trend =
    last28.rides < 3
      ? 'insufficient_data'
      : previous7.load > 0 && last7.load < previous7.load * 0.75
        ? 'reduced'
        : previous7.load > 0 && last7.load > previous7.load * 1.2
          ? 'increasing'
          : 'steady'
  const recommendation =
    trend === 'insufficient_data'
      ? 'maintain'
      : ratio !== null && ratio >= 1.3
        ? 'recover'
        : last7.hardRides >= 3
          ? 'recover'
          : trend === 'reduced'
            ? 'maintain'
            : 'progress'

  return {
    asOf: now.toISOString(),
    data: {
      activityCount: sorted.length,
      firstActivityAt: sorted[0]?.startAt ?? null,
      latestActivityAt: sorted.at(-1)?.startAt ?? null,
    },
    volume: {
      last7DaysHours: round(last7.hours),
      last28DaysHours: round(last28.hours),
      last84DaysHours: round(last84.hours),
      last7DaysRides: last7.rides,
      last28DaysRides: last28.rides,
    },
    load: {
      last7Days: Math.round(last7.load),
      last28Days: Math.round(last28.load),
      acuteToChronicRatio: ratio === null ? null : round(ratio, 2),
    },
    intensity: {
      last7DaysHardRides: last7.hardRides,
      last7DaysHardMinutes: Math.round(last7.hardMinutes),
    },
    trend,
    recommendation,
  }
}
