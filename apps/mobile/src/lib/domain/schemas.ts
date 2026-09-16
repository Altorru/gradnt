import { z } from 'zod'

export const dataProvenanceSchema = z.enum(['declared', 'observed'])

export type DataProvenance = z.infer<typeof dataProvenanceSchema>

export const athleteProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  primaryDiscipline: z.enum(['road', 'gravel', 'mtb']),
  experienceLevel: z.enum(['beginner', 'regular', 'advanced']),
  weeklyVolumeBand: z.enum(['lt3', '3to6', '6to10', 'gt10']),
  provenance: z.literal('declared'),
})

export const goalMeasureSchema = z.enum(['cumulative', 'best'])
export type GoalMeasure = z.infer<typeof goalMeasureSchema>

export const goalSchema = z.object({
  id: z.string(),
  type: z.enum(['ftp', 'distance', 'event', 'climbing', 'fitness']),
  targetValue: z.number().positive().nullable(),
  targetUnit: z.enum(['w', 'km', 'm', 'h', 'none']),
  /**
   * How a distance or climbing target is read: accumulated over the window, or
   * the best single ride. Null for the types where it means nothing, rather
   * than a default nobody chose.
   */
  measure: goalMeasureSchema.nullable(),
  targetDate: z.string().datetime().nullable(),
  status: z.enum(['active', 'completed', 'paused']),
  createdAt: z.string().datetime(),
})

export const activitySchema = z.object({
  id: z.string(),
  source: z.enum(['strava', 'garmin', 'manual']),
  externalId: z.string().nullable(),
  sportType: z.enum(['road', 'gravel', 'mtb', 'indoor_cycling']),
  startAt: z.string().datetime(),
  durationSeconds: z.number().int().nonnegative(),
  distanceMeters: z.number().nonnegative(),
  elevationGainMeters: z.number().nonnegative(),
  averageHeartRate: z.number().positive().nullable(),
  maxHeartRate: z.number().positive().nullable(),
  averagePower: z.number().positive().nullable(),
  normalizedPower: z.number().positive().nullable(),
  weightedPower: z.number().positive().nullable(),
  calories: z.number().nonnegative().nullable(),
  /**
   * Always observed: an activity only ever enters the app from Strava. The demo
   * fixtures were the sole producer of `'mock'`, and they are gone.
   */
  provenance: z.literal('observed'),
})

export const plannedWorkoutSchema = z.object({
  id: z.string(),
  date: z.string().datetime(),
  type: z.enum(['endurance', 'tempo', 'sweet_spot', 'threshold', 'vo2_max', 'recovery']),
  title: z.string().min(1),
  durationMinutes: z.number().int().positive(),
  intensityTarget: z.string().min(1),
  structure: z.string().min(1),
  status: z.enum(['planned', 'completed', 'skipped', 'moved']),
  reason: z.string().min(1),
})

export const trainingPlanSchema = z.object({
  id: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  goalId: z.string(),
  weeks: z.array(
    z.object({
      weekNumber: z.number().int().positive(),
      workouts: z.array(plannedWorkoutSchema),
    }),
  ),
  version: z.number().int().positive(),
  status: z.enum(['draft', 'active', 'archived']),
})

export const trainingMetricsSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  durationSeconds: z.number().int().nonnegative(),
  distanceMeters: z.number().nonnegative(),
  elevationGainMeters: z.number().nonnegative(),
  activityCount: z.number().int().nonnegative(),
  /**
   * `'none'` rather than falling through to `'mock'`: with no activities there
   * is nothing observed to report, and the old fall-through labelled a
   * zero-ride history as demonstration data.
   */
  provenance: z.enum(['none', 'observed']),
})

export type AthleteProfile = z.infer<typeof athleteProfileSchema>
export type Goal = z.infer<typeof goalSchema>
export type Activity = z.infer<typeof activitySchema>
export type PlannedWorkout = z.infer<typeof plannedWorkoutSchema>
export type TrainingPlan = z.infer<typeof trainingPlanSchema>
export type TrainingMetrics = z.infer<typeof trainingMetricsSchema>
