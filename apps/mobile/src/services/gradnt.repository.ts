import type { MessageKey, Translate } from '@/i18n'
import { loadOnboardingSnapshot } from '@/features/onboarding/services/onboarding.persistence'
import {
  generateFirstPlan,
  buildTrainingMetrics,
  getEventDaysRemaining,
  getGoalCurrentValue,
  getWeeklyVolumeFloorHours,
  trainingPlanSchema,
  type Activity,
  type AthleteProfile,
  type DataProvenance,
  type Goal,
  type PlannedWorkout,
  type TrainingMetrics,
  type TrainingPlan,
} from '@/lib/domain'

import { loadCurrentFtp } from './ftp/ftp.persistence'
import { fetchRecentActivities, historyWindowStart } from './strava/api/strava-activity.service'

/** Used when a snapshot predates the profile, or stored a band we no longer know. */
const DEFAULT_WEEKLY_VOLUME_BAND = '3to6' as const

export type GoalValueSnapshot = {
  value: number | null
  provenance: Extract<DataProvenance, 'observed' | 'declared'>
}

/**
 * The four ways fetching rides can fail, as catalogue keys.
 *
 * Codes, not sentences: a rider who has not connected Strava and a rider whose
 * session expired need different things done, so the four stay separate — but
 * *which* failure happened is all this service knows, and how to say it belongs
 * to the catalogue.
 */
const ACTIVITY_FAILURE_KEYS = {
  disconnected: 'strava.failures.disconnected',
  expired: 'strava.failures.expired',
  rateLimited: 'strava.failures.rateLimited',
  error: 'strava.failures.error',
} as const satisfies Record<string, MessageKey>

export type ActivityFailureReason = keyof typeof ACTIVITY_FAILURE_KEYS

/**
 * Why activities could not be fetched.
 *
 * The message carries the code rather than a sentence: nothing renders it, and
 * a code is what makes a log line worth reading.
 */
export class StravaActivitiesError extends Error {
  constructor(
    readonly reason: ActivityFailureReason,
    readonly detail?: string,
  ) {
    // The catch-all keeps the underlying message, because "something went
    // wrong" is what made this failure invisible in the first place.
    super(detail === undefined ? reason : `${reason}: ${detail}`)
    this.name = 'StravaActivitiesError'
  }
}

/**
 * The failure, in the rider's language.
 *
 * Takes the translator rather than returning a sentence, so the wording stays
 * in the catalogue and a module that fetches rides never holds it.
 */
export function describeActivityFailure(error: unknown, t: Translate): string {
  if (!(error instanceof StravaActivitiesError)) {
    return t(ACTIVITY_FAILURE_KEYS.error)
  }

  const sentence = t(ACTIVITY_FAILURE_KEYS[error.reason])

  if (error.reason !== 'error' || error.detail === undefined) {
    return sentence
  }

  return t('strava.failures.withDetail', { sentence, detail: error.detail })
}

export interface GradntRepository {
  /** Null when onboarding has not run: there is nothing to derive one from. */
  getAthlete(): Promise<AthleteProfile | null>
  getGoal(): Promise<Goal | null>
  getCurrentGoalValue(): Promise<GoalValueSnapshot>
  getActivities(): Promise<Activity[]>
  getTrainingMetrics(): Promise<TrainingMetrics>
  getTrainingPlan(): Promise<TrainingPlan>
  getUpcomingWorkouts(): Promise<PlannedWorkout[]>
}

async function getGeneratedTrainingPlan(): Promise<TrainingPlan | null> {
  const snapshot = await loadOnboardingSnapshot()

  if (!snapshot?.profile || !snapshot.goal || !snapshot.availability) {
    return null
  }

  const workouts = generateFirstPlan({
    profile: snapshot.profile,
    goal: snapshot.goal,
    availability: snapshot.availability,
    startDate: new Date(),
  })

  if (workouts.length === 0) {
    return null
  }

  return trainingPlanSchema.parse({
    id: 'plan-local-first',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    goalId: 'goal-local-first',
    weeks: [{ weekNumber: 1, workouts }],
    version: 1,
    status: 'active',
  })
}

/**
 * A valid plan with no workouts, for when there is nothing to generate from.
 *
 * Callers render their empty state from `weeks.length === 0`; substituting a
 * ready-made week would show the rider a schedule that is not theirs.
 */
function emptyTrainingPlan(): TrainingPlan {
  const now = new Date().toISOString()

  return trainingPlanSchema.parse({
    id: 'plan-empty',
    startDate: now,
    endDate: now,
    goalId: 'goal-local',
    weeks: [],
    version: 1,
    status: 'active',
  })
}

export class MockGradntRepository implements GradntRepository {
  /**
   * Derived from onboarding answers, or null.
   *
   * The demo athlete used to stand in here. Nothing was real about it, and the
   * app cannot reach this screen without having been through onboarding anyway.
   */
  async getAthlete(): Promise<AthleteProfile | null> {
    const snapshot = await loadOnboardingSnapshot()

    return snapshot?.profile
      ? {
          id: 'athlete-local',
          displayName: 'Cycliste GRADNT',
          primaryDiscipline: snapshot.profile.discipline,
          experienceLevel: snapshot.profile.experience,
          weeklyVolumeBand: snapshot.profile.weeklyVolume,
          provenance: 'declared' as const,
        }
      : null
  }

  async getGoal(): Promise<Goal | null> {
    const snapshot = await loadOnboardingSnapshot()

    if (!snapshot?.goal) {
      return null
    }

    // A fitness goal has no figure to enter: its target is the floor of the
    // weekly-volume band the rider declared, expressed in hours.
    if (snapshot.goal.type === 'fitness') {
      return {
        id: 'goal-local',
        type: 'fitness',
        targetValue: getWeeklyVolumeFloorHours(
          snapshot.profile?.weeklyVolume ?? DEFAULT_WEEKLY_VOLUME_BAND,
        ),
        targetUnit: 'h',
        measure: null,
        targetDate: null,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
      }
    }

    const targetValue = snapshot.goal.targetValue ? Number(snapshot.goal.targetValue) : null
    const targetUnit: Goal['targetUnit'] =
      snapshot.goal.type === 'ftp'
        ? 'w'
        : snapshot.goal.type === 'distance'
          ? 'km'
          : snapshot.goal.type === 'climbing'
            ? 'm'
            : 'none'

    return {
      id: 'goal-local',
      type: snapshot.goal.type,
      targetValue,
      targetUnit,
      // Absent from snapshots saved before the measure existed; a running total
      // was the only behaviour then, so that is the honest default.
      measure: snapshot.goal.measure ?? 'cumulative',
      targetDate: snapshot.goal.targetDate ?? null,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    }
  }

  async getCurrentGoalValue(): Promise<GoalValueSnapshot> {
    const goal = await this.getGoal()

    if (goal === null) {
      return { value: null, provenance: 'declared' }
    }

    // An event has no total to reach, so its standing is the countdown to the
    // day itself — the only quantity that changes and that a rider acts on.
    if (goal.type === 'event') {
      const daysRemaining = getEventDaysRemaining(goal)

      return daysRemaining === null
        ? { value: null, provenance: 'declared' }
        : { value: daysRemaining, provenance: 'observed' }
    }

    const activities = await this.getActivities()

    if (activities.length === 0) {
      return { value: null, provenance: 'declared' }
    }

    const value = getGoalCurrentValue(goal, activities, await loadCurrentFtp())

    return value === null
      ? { value: null, provenance: 'declared' }
      : { value, provenance: 'observed' }
  }

  /**
   * The rider's real activities.
   *
   * Throws rather than collapsing every failure to an empty list. "No rides" and
   * "we could not ask" look identical on a screen, but only one of them needs
   * the rider to act — and the silent version left a connected rider staring at
   * zeroes with nothing to explain them.
   */
  async getActivities(): Promise<Activity[]> {
    const result = await fetchRecentActivities()

    if (result.status === 'ready') {
      return result.activities
    }

    throw new StravaActivitiesError(
      result.status,
      result.status === 'error' && result.error instanceof Error ? result.error.message : undefined,
    )
  }

  async getTrainingMetrics() {
    const activities = await this.getActivities()
    const now = new Date()

    // Derived from the same window the activities were fetched over, rather
    // than a hardcoded pair of dates that described a period nothing covered.
    return buildTrainingMetrics(
      activities,
      historyWindowStart(now).toISOString(),
      now.toISOString(),
    )
  }

  async getTrainingPlan() {
    // An empty plan, not the demo one. With no onboarding snapshot there is
    // nothing to generate from, and showing a plausible pre-built week would
    // present fiction as the rider's own schedule.
    return (await getGeneratedTrainingPlan()) ?? emptyTrainingPlan()
  }

  async getUpcomingWorkouts() {
    const plan = await this.getTrainingPlan()
    return plan.weeks.flatMap((week) => week.workouts)
  }
}

export const gradntRepository: GradntRepository = new MockGradntRepository()
