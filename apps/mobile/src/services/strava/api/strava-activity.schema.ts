import { z } from 'zod'

/**
 * The slice of Strava's `SummaryActivity` this app actually consumes.
 *
 * Deliberately narrow: Strava returns roughly fifty fields, and validating all
 * of them would mean a schema that fails whenever they add or rename one we do
 * not use.
 *
 * `average_heartrate`, `average_watts` and friends are nullable *and* optional
 * because a ride recorded without a sensor omits them, and a ride with a sensor
 * that dropped out reports `0`. Zeros are handled by the normalizer, not here —
 * a `nonnegative()` here would let a phantom 0 heart rate through as real.
 */
export const stravaActivitySchema = z.object({
  id: z.union([z.number(), z.string()]),
  /** Present on recent activities; older ones only carry the legacy `type`. */
  sport_type: z.string().nullish(),
  type: z.string().nullish(),
  start_date: z.string(),
  moving_time: z.number().nonnegative(),
  distance: z.number().nonnegative(),
  total_elevation_gain: z.number().nonnegative(),
  average_heartrate: z.number().nullish(),
  max_heartrate: z.number().nullish(),
  average_watts: z.number().nullish(),
  weighted_average_watts: z.number().nullish(),
  kilojoules: z.number().nullish(),
})

export type StravaActivity = z.infer<typeof stravaActivitySchema>
