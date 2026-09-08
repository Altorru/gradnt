import { z } from 'zod'

export const routeModeSchema = z.enum(['road', 'gravel', 'mtb'])
export const trainingIntentSchema = z.enum(['endurance', 'tempo', 'climbing', 'recovery'])

export const routePreferencesSchema = z.object({
  mode: routeModeSchema,
  targetDistanceKm: z.number().positive(),
  targetElevationGainMeters: z.number().nonnegative(),
  lowTraffic: z.boolean(),
  trainingIntent: trainingIntentSchema,
  loop: z.boolean(),
})

export type RouteMode = z.infer<typeof routeModeSchema>
export type TrainingIntent = z.infer<typeof trainingIntentSchema>
export type RoutePreferences = z.infer<typeof routePreferencesSchema>

export const defaultRoutePreferences: RoutePreferences = {
  mode: 'road',
  targetDistanceKm: 60,
  targetElevationGainMeters: 500,
  lowTraffic: true,
  trainingIntent: 'endurance',
  loop: true,
}
