import { z } from 'zod'

import { routeModeSchema, trainingIntentSchema } from './route-preferences'

export const routePointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  elevationMeters: z.number().nullable(),
})

export const elevationPointSchema = z.object({
  distanceMeters: z.number().nonnegative(),
  elevationMeters: z.number(),
})

export const climbSchema = z.object({
  id: z.string(),
  startDistanceMeters: z.number().nonnegative(),
  endDistanceMeters: z.number().nonnegative(),
  lengthMeters: z.number().nonnegative(),
  elevationGainMeters: z.number().nonnegative(),
  averageGradientPercent: z.number().nonnegative(),
  maximumGradientPercent: z.number().nonnegative(),
  difficultyScore: z.number().min(0).max(100),
})

export const breakdownItemSchema = z.object({
  label: z.string().min(1),
  percentage: z.number().min(0).max(100),
})

export const trafficExposureSchema = z.object({
  score: z.number().min(0).max(100),
  label: z.enum(['low', 'moderate', 'high', 'unknown']),
  rationale: z.string().min(1),
})

export const liveTrafficSegmentSchema = z.object({
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  congestion: z.enum(['低', 'modérée', 'élevée', 'inconnue']),
})

export const routeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  mode: routeModeSchema,
  geometry: z.array(routePointSchema).min(2),
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().int().nonnegative(),
  elevationGainMeters: z.number().nonnegative(),
  elevationLossMeters: z.number().nonnegative(),
  elevationProfile: z.array(elevationPointSchema).min(2),
  climbs: z.array(climbSchema),
  surfaceBreakdown: z.array(breakdownItemSchema),
  wayTypeBreakdown: z.array(breakdownItemSchema),
  suitability: z.number().min(0).max(100),
  trafficExposure: trafficExposureSchema,
  liveTraffic: z.array(liveTrafficSegmentSchema),
  trainingIntentFit: z.number().min(0).max(100),
  provider: z.object({
    name: z.enum(['mock', 'openrouteservice']),
    profile: z.string(),
  }),
})

export type RoutePoint = z.infer<typeof routePointSchema>
export type ElevationPoint = z.infer<typeof elevationPointSchema>
export type Climb = z.infer<typeof climbSchema>
export type BreakdownItem = z.infer<typeof breakdownItemSchema>
export type TrafficExposure = z.infer<typeof trafficExposureSchema>
export type LiveTrafficSegment = z.infer<typeof liveTrafficSegmentSchema>
export type Route = z.infer<typeof routeSchema>

export type RouteWithScore = Route & {
  trainingIntent: z.infer<typeof trainingIntentSchema>
  recommendationLabel: 'recommended' | 'quieter' | 'training'
  score: number
}
