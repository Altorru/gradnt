import { z } from 'zod'

export const routeModeSchema = z.enum(['road', 'gravel', 'mtb'])
export const trainingIntentSchema = z.enum(['endurance', 'tempo', 'climbing', 'recovery'])
export const surfacePreferenceSchema = z.enum(['paved', 'mixed', 'gravel', 'trail'])

/**
 * A span the rider is happy with, rather than one figure they would have to hit.
 *
 * "60 km" was a target, so a 55 km route scored worse than an exact 60 — which
 * is not how anyone plans a ride. A rider wants a ride *of about* that length,
 * and everything inside their span is equally right.
 */
export const distanceRangeKmSchema = z
  .object({ min: z.number().positive(), max: z.number().positive() })
  .refine((range) => range.min <= range.max, {
    message: 'Le minimum doit être inférieur ou égal au maximum.',
  })

export const elevationRangeMSchema = z.object({
  min: z.number().nonnegative(),
  max: z.number().nonnegative(),
})

export type DistanceRangeKm = z.infer<typeof distanceRangeKmSchema>
export type ElevationRangeM = z.infer<typeof elevationRangeMSchema>

export const routePreferencesSchema = z.object({
  mode: routeModeSchema,
  distanceRangeKm: distanceRangeKmSchema,
  elevationRangeM: elevationRangeMSchema,
  lowTraffic: z.boolean(),
  surfacePreference: surfacePreferenceSchema,
  trainingIntent: trainingIntentSchema,
  plannedWorkoutIntent: trainingIntentSchema.optional(),
  loop: z.boolean(),
})

export type RouteMode = z.infer<typeof routeModeSchema>
export type TrainingIntent = z.infer<typeof trainingIntentSchema>
export type SurfacePreference = z.infer<typeof surfacePreferenceSchema>
export type RoutePreferences = z.infer<typeof routePreferencesSchema>

export const defaultRoutePreferences: RoutePreferences = {
  mode: 'road',
  distanceRangeKm: { min: 40, max: 90 },
  elevationRangeM: { min: 200, max: 800 },
  lowTraffic: true,
  surfacePreference: 'paved',
  trainingIntent: 'endurance',
  plannedWorkoutIntent: 'endurance',
  loop: true,
}

/**
 * The middle of a span.
 *
 * The routing engine takes a single round-trip length, so it is asked for the
 * centre of what the rider wants — the proposals then land inside their span on
 * either side, and the ranking decides among them.
 */
export function midpointOf(range: { min: number; max: number }): number {
  return (range.min + range.max) / 2
}
