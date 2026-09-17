import type { Translation } from '@/i18n'

import type { Activity, Goal, PlannedWorkout, TrainingMetrics } from './schemas'

export type ActivityDataState = 'none' | 'observed'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export type DeterministicTrainingInsight = {
  title: string
  message: string
  provenance: 'declared' | 'observed'
}

export function getGoalProgressPercentage(goal: Goal, currentValue: number | null): number {
  if (goal.targetValue === null || currentValue === null || goal.targetValue <= 0) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round((currentValue / goal.targetValue) * 100)))
}

export function getRecentTrainingVolumeHours(metrics: TrainingMetrics): number {
  return Math.round((metrics.durationSeconds / 3600) * 100) / 100
}

export function getWeeklyRideCount(activities: Activity[]): number {
  return activities.length
}

export function getActivityDataState(activities: Activity[]): ActivityDataState {
  return activities.length > 0 ? 'observed' : 'none'
}

export function getTotalDistanceKm(activities: Activity[]): number {
  return (
    Math.round(
      (activities.reduce((total, activity) => total + activity.distanceMeters, 0) / 1000) * 10,
    ) / 10
  )
}

export function getTotalElevationGainMeters(activities: Activity[]): number {
  return Math.round(activities.reduce((total, activity) => total + activity.elevationGainMeters, 0))
}

/** The longest single ride, in kilometres. Zero when nothing has been ridden. */
export function getBestRideDistanceKm(activities: Activity[]): number {
  const longest = activities.reduce((best, activity) => Math.max(best, activity.distanceMeters), 0)

  return Math.round((longest / 1000) * 10) / 10
}

/** The biggest single climb, in metres of elevation gain. */
export function getBestRideElevationGainMeters(activities: Activity[]): number {
  return Math.round(
    activities.reduce((best, activity) => Math.max(best, activity.elevationGainMeters), 0),
  )
}

/**
 * Mean training hours per week the rider has actually been riding.
 *
 * Two weeks are deliberately left out. The current one is still in progress, so
 * counting it would report a rider who trained five hours by Friday as being
 * under target. And weeks before their first recorded ride are not zero weeks —
 * they are weeks they were not riding yet, and averaging those in would put
 * every recent starter permanently below their own target.
 */
export function getAverageWeeklyHours(activities: Activity[], weeks = 4): number {
  const series = getWeeklyVolumeSeries(activities, weeks)
  const firstRideWeek = series.findIndex((hours) => hours > 0)

  if (firstRideWeek === -1) {
    return 0
  }

  const counted = series.slice(firstRideWeek, -1)

  if (counted.length === 0) {
    // No completed week yet, so the week in progress is the only evidence
    // there is. Reporting zero would tell a rider who has just ridden that they
    // have done nothing.
    return series.at(-1) ?? 0
  }

  const total = counted.reduce((sum, hours) => sum + hours, 0)

  return Math.round((total / counted.length) * 10) / 10
}

/**
 * The bottom of each declared weekly-volume band, in hours.
 *
 * A fitness goal has no natural target figure, so it targets the floor of the
 * band the rider chose at sign-up — "at least what you said you would do".
 * `lt3` uses the band's own ceiling, since its floor is zero and a target of
 * zero would read as met before the first ride.
 */
const WEEKLY_VOLUME_FLOOR_HOURS = {
  lt3: 3,
  '3to6': 3,
  '6to10': 6,
  gt10: 10,
} as const

export function getWeeklyVolumeFloorHours(band: keyof typeof WEEKLY_VOLUME_FLOOR_HOURS): number {
  return WEEKLY_VOLUME_FLOOR_HOURS[band]
}

/**
 * Whole days until an event, or null when the goal has no usable date.
 *
 * Floors at zero rather than going negative: once the day arrives the
 * countdown is over, and "−3 jours" is not a useful thing to show a rider.
 */
export function getEventDaysRemaining(goal: Goal, now: Date = new Date()): number | null {
  if (goal.targetDate === null) {
    return null
  }

  const target = Date.parse(goal.targetDate)

  if (Number.isNaN(target)) {
    return null
  }

  return Math.max(0, Math.ceil((target - now.getTime()) / DAY_MS))
}

/**
 * The rider's current standing against the goal, or null when nothing honest
 * can be read off their data.
 *
 * This is the whole of the goal business logic, kept pure so it can be tested
 * without a device — the repository's only job is to supply the activities and
 * the FTP.
 *
 * - `distance` and `climbing` read a running total or the best single ride,
 *   whichever the rider chose.
 * - `ftp` is not a ride statistic: it comes from what the rider or Strava says.
 * - `fitness` is average weekly hours, compared against the band declared.
 * - `event` has no value at all. It has a deadline, and the caller renders a
 *   countdown; a current-over-target ratio would mean nothing.
 */
export function getGoalCurrentValue(
  goal: Goal,
  activities: Activity[],
  ftp: number | null,
): number | null {
  switch (goal.type) {
    case 'distance':
      return goal.measure === 'best'
        ? getBestRideDistanceKm(activities)
        : getTotalDistanceKm(activities)

    case 'climbing':
      return goal.measure === 'best'
        ? getBestRideElevationGainMeters(activities)
        : getTotalElevationGainMeters(activities)

    case 'ftp':
      return ftp

    case 'fitness':
      return getAverageWeeklyHours(activities)

    case 'event':
      return null
  }
}

/**
 * Spreads activities across the last `weeks` weeks, oldest first, weighing each
 * by whatever the caller cares about.
 *
 * Shared by the two series the progress charts draw, so they bucket identically
 * — a ride that lands in week 3 for one must land in week 3 for the other, or
 * the two charts would disagree about the same history.
 *
 * Weeks with no riding are genuine zeroes and stay in the series, so a gap reads
 * as a gap rather than as compression.
 */
function bucketActivitiesByWeek(
  activities: Activity[],
  weeks: number,
  weigh: (activity: Activity) => number,
): number[] {
  const buckets = new Array<number>(weeks).fill(0)
  const now = Date.now()

  for (const activity of activities) {
    const startAt = Date.parse(activity.startAt)

    if (Number.isNaN(startAt)) {
      continue
    }

    const index = weeks - 1 - Math.floor((now - startAt) / WEEK_MS)

    if (index >= 0 && index < weeks) {
      buckets[index] += weigh(activity)
    }
  }

  return buckets
}

/**
 * Training hours per week.
 *
 * Replaces the invented series these charts used to draw. A fabricated shape
 * presented next to real totals is worse than no chart, because nothing on the
 * screen distinguishes the two.
 */
export function getWeeklyVolumeSeries(activities: Activity[], weeks = 8): number[] {
  return bucketActivitiesByWeek(
    activities,
    weeks,
    (activity) => activity.durationSeconds / 3600,
  ).map((hours) => Math.round(hours * 10) / 10)
}

/**
 * Rides per week, as whole numbers.
 *
 * A separate series from the hours, because they answer different questions: an
 * hour count says how much the rider trained, a ride count says how often. The
 * progress screen was drawing hours on both cards, so the card about regularity
 * was showing the same shape as the one about volume.
 */
export function getWeeklyRideCountSeries(activities: Activity[], weeks = 8): number[] {
  return bucketActivitiesByWeek(activities, weeks, () => 1)
}

/** Kilometres ridden per week, to one decimal. */
export function getWeeklyDistanceSeries(activities: Activity[], weeks = 8): number[] {
  return bucketActivitiesByWeek(
    activities,
    weeks,
    (activity) => activity.distanceMeters / 1000,
  ).map((km) => Math.round(km * 10) / 10)
}

/** Metres climbed per week, as whole numbers. */
export function getWeeklyElevationSeries(activities: Activity[], weeks = 8): number[] {
  return bucketActivitiesByWeek(activities, weeks, (activity) => activity.elevationGainMeters).map(
    (metres) => Math.round(metres),
  )
}

/**
 * The newest window against the one before it.
 *
 * Both cover exactly seven days, so they are directly comparable. A calendar
 * week would not be: comparing "this week so far" with "last week" makes every
 * Monday morning look like a collapse, which is why the series are rolling
 * windows in the first place.
 *
 * Null when there is nothing to compare — a first week has no previous.
 */
export function getWindowDelta(
  series: number[],
): { current: number; previous: number; delta: number } | null {
  if (series.length < 2) {
    return null
  }

  const current = series.at(-1) ?? 0
  const previous = series.at(-2) ?? 0

  return { current, previous, delta: Math.round((current - previous) * 10) / 10 }
}

/**
 * The seven days a point in either series covers.
 *
 * These are rolling windows counted back from now, not calendar weeks — so the
 * label has to say "du 12 au 18 août" rather than name a week number, which
 * would claim an alignment the data does not have.
 */
export function getWeekWindow(
  index: number,
  weeks: number,
  now: Date = new Date(),
): { start: Date; end: Date } {
  const weeksBeforeEnd = weeks - index - 1
  const end = new Date(now.getTime() - weeksBeforeEnd * WEEK_MS)

  return { start: new Date(end.getTime() - WEEK_MS), end }
}

/**
 * What to say about where a rider is starting from.
 *
 * Takes the translator rather than returning keys, the way the label maps do:
 * the sentence belongs to the catalogue, and a domain module has no business
 * deciding how it reads. It also makes the count a real plural — the sentence
 * this replaced glued an `s` on for anything above one, which is the rule
 * English uses and French does not.
 */
export function getDeterministicTrainingInsight(
  activities: Activity[],
  declaredWeeklyVolumeBand: 'lt3' | '3to6' | '6to10' | 'gt10',
  { t, plural }: Translation,
): DeterministicTrainingInsight {
  const activityState = getActivityDataState(activities)

  if (activityState === 'none') {
    return {
      title: t('insights.startTitle'),
      message: t('insights.startMessage', { band: declaredWeeklyVolumeBand }),
      provenance: 'declared',
    }
  }

  return {
    title: t('insights.observedTitle'),
    message: plural('insights.observedMessage', getWeeklyRideCount(activities)),
    provenance: 'observed',
  }
}

export function getPlanCompletionPercentage(workouts: PlannedWorkout[]): number {
  if (workouts.length === 0) {
    return 0
  }

  const completed = workouts.filter((workout) => workout.status === 'completed').length
  return Math.round((completed / workouts.length) * 100)
}

export function getTrendDirection(
  currentValue: number,
  previousValue: number,
): 'up' | 'down' | 'stable' {
  if (currentValue > previousValue) {
    return 'up'
  }

  if (currentValue < previousValue) {
    return 'down'
  }

  return 'stable'
}

export function getNextWorkout(workouts: PlannedWorkout[]): PlannedWorkout | null {
  return workouts.find((workout) => workout.status === 'planned') ?? null
}

/**
 * The intensity bands a ride falls into, by intensity factor.
 *
 * The boundaries are the conventional ones: a ride's intensity factor — its
 * normalised power over FTP — places it in a band, and the bands run from
 * recovery up to VO₂ max.
 */
export type IntensityZone = 'recovery' | 'endurance' | 'tempo' | 'threshold' | 'vo2max'

const INTENSITY_BANDS: readonly { zone: IntensityZone; below: number }[] = [
  { zone: 'recovery', below: 0.55 },
  { zone: 'endurance', below: 0.75 },
  { zone: 'tempo', below: 0.9 },
  { zone: 'threshold', below: 1.05 },
  { zone: 'vo2max', below: Number.POSITIVE_INFINITY },
]

export type IntensityShare = {
  zone: IntensityZone
  hours: number
  /** Fraction of the analysed time, 0–1. */
  share: number
}

/**
 * How the rider's training splits across intensity bands.
 *
 * Null when it cannot be known, which is the common case rather than a failure:
 * it needs an FTP *and* rides recorded with a power meter. Both are absent for
 * most riders, and a split inferred from heart rate alone would be the kind of
 * plausible-looking figure this app has spent its time removing.
 *
 * Rides without power are left out of the total rather than assumed easy, so
 * the shares describe the power rides only — which is what the label says.
 */
export function getIntensityDistribution(
  activities: Activity[],
  ftp: number | null,
): IntensityShare[] | null {
  if (ftp === null || ftp <= 0) {
    return null
  }

  const hoursByZone = new Map<IntensityZone, number>()
  let total = 0

  for (const activity of activities) {
    // Weighted power where it exists — it is Strava's normalised-power
    // approximation, and intensity is about the whole ride, not its average.
    const power = activity.weightedPower ?? activity.averagePower

    if (power === null || power <= 0) {
      continue
    }

    const band = INTENSITY_BANDS.find((candidate) => power / ftp < candidate.below)

    if (band === undefined) {
      continue
    }

    const hours = activity.durationSeconds / 3600
    hoursByZone.set(band.zone, (hoursByZone.get(band.zone) ?? 0) + hours)
    total += hours
  }

  if (total === 0) {
    return null
  }

  return INTENSITY_BANDS.map((band) => {
    const hours = hoursByZone.get(band.zone) ?? 0

    return { zone: band.zone, hours: Math.round(hours * 10) / 10, share: hours / total }
  }).filter((entry) => entry.hours > 0)
}
