import { loadOnboardingSnapshot } from '@/features/onboarding/services/onboarding.persistence'
import {
  generateFirstPlan,
  buildTrainingMetrics,
  getTotalDistanceKm,
  getTotalElevationGainMeters,
  trainingPlanSchema,
  type Activity,
  type AthleteProfile,
  type DataProvenance,
  type Goal,
  type PlannedWorkout,
  type TrainingMetrics,
  type TrainingPlan,
} from '@/lib/domain'

import { fetchRecentActivities, historyWindowStart } from './strava/api/strava-activity.service'

export type GoalValueSnapshot = {
  value: number | null
  provenance: Extract<DataProvenance, 'observed' | 'declared'>
}

const ACTIVITY_FAILURE_MESSAGES = {
  disconnected: 'Aucun compte Strava n’est relié.',
  expired:
    'Ta connexion Strava a expiré ou ses autorisations sont incomplètes. Reconnecte ton compte dans les réglages.',
  rateLimited: 'Strava limite temporairement les demandes. Réessaie dans quelques minutes.',
  error: 'Tes sorties Strava n’ont pas pu être récupérées.',
} as const

/**
 * Why activities could not be fetched, in words a rider can act on.
 *
 * The four failures stay separate all the way to the screen. Telling a rider
 * whose session expired the same thing as a rider who simply has not ridden yet
 * leaves only one of them with anything to do.
 */
export class StravaActivitiesError extends Error {
  constructor(
    readonly reason: keyof typeof ACTIVITY_FAILURE_MESSAGES,
    detail?: string,
  ) {
    // The known failures read as sentences. The catch-all carries the
    // underlying message, because "something went wrong" is what made this
    // failure invisible in the first place.
    super(
      reason === 'error' && detail
        ? `${ACTIVITY_FAILURE_MESSAGES.error} (${detail})`
        : ACTIVITY_FAILURE_MESSAGES[reason],
    )
    this.name = 'StravaActivitiesError'
  }
}

/** Renders any thrown activity failure as something worth showing a rider. */
export function describeActivityFailure(error: unknown): string {
  return error instanceof Error ? error.message : ACTIVITY_FAILURE_MESSAGES.error
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
      targetDate: null,
      status: 'active' as const,
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * The rider's progress toward the goal, derived from their own rides.
   *
   * Only the goal types whose target is a running total can be read off
   * activity data — distance and climbing. An FTP or an event has no
   * counterpart in a ride feed, so those report nothing rather than a number
   * nobody can justify. The invented `258` that used to stand here is gone.
   */
  async getCurrentGoalValue(): Promise<GoalValueSnapshot> {
    const goal = await this.getGoal()

    if (goal === null || (goal.type !== 'distance' && goal.type !== 'climbing')) {
      return { value: null, provenance: 'declared' }
    }

    const activities = await this.getActivities()

    if (activities.length === 0) {
      return { value: null, provenance: 'declared' }
    }

    return {
      value:
        goal.type === 'distance'
          ? getTotalDistanceKm(activities)
          : getTotalElevationGainMeters(activities),
      provenance: 'observed',
    }
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
