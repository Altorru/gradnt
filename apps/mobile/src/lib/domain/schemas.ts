import { z } from 'zod'

export const athleteProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().min(1),
  primaryDiscipline: z.enum(['road', 'gravel', 'mtb']),
  experienceLevel: z.enum(['beginner', 'regular', 'advanced']),
  weeklyVolumeBand: z.enum(['lt3', '3to6', '6to10', 'gt10']),
})

export const goalSchema = z.object({
  id: z.string(),
  type: z.enum(['ftp', 'distance', 'event', 'climbing', 'fitness']),
  targetValue: z.number().positive().nullable(),
  targetUnit: z.enum(['w', 'km', 'm', 'none']),
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
})

export type AthleteProfile = z.infer<typeof athleteProfileSchema>
export type Goal = z.infer<typeof goalSchema>
export type Activity = z.infer<typeof activitySchema>
export type PlannedWorkout = z.infer<typeof plannedWorkoutSchema>
export type TrainingPlan = z.infer<typeof trainingPlanSchema>
export type TrainingMetrics = z.infer<typeof trainingMetricsSchema>
