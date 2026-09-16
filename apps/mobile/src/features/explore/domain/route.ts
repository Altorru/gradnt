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

/**
 * What a surface is, as a value rather than as words.
 *
 * The breakdown used to carry French labels, and the scoring read them back by
 * comparing the text — `label === 'Piste cyclable'`. Translating those labels
 * would have made every comparison fail in silence, which `?? 0` then turned
 * into a zero traffic-exposure score. The vocabulary is codes now, and the
 * words live in the catalogue where the rest of the copy already was.
 */
export const surfaceCodes = [
  'unknown',
  'paved',
  'unpaved',
  'asphalt',
  'concrete',
  'pavingStones',
  'metal',
  'wood',
  'compactedGravel',
  'fineGravel',
  'gravel',
  'dirt',
  'ground',
  'ice',
  'concretePlates',
  'sand',
  'woodchips',
  'grass',
  'grassPaver',
] as const

export const wayTypeCodes = [
  'unknown',
  'primary',
  'secondary',
  'street',
  'path',
  'track',
  'cycleway',
  'footway',
  'steps',
  'ferry',
  'construction',
] as const

/**
 * The handful of surfaces a rider is actually shown.
 *
 * `unpaved` groups under `unknown` rather than under a guess: it means the
 * source did not say, and calling it trail would be inventing a fact. It used
 * to group under *paved*, because the old substring match looked for `revêt`
 * and found it inside "non revêtue".
 */
export const surfaceGroupCodes = ['paved', 'compacted', 'gravel', 'trail', 'unknown'] as const

export type SurfaceCode = (typeof surfaceCodes)[number]
export type WayTypeCode = (typeof wayTypeCodes)[number]
export type SurfaceGroupCode = (typeof surfaceGroupCodes)[number]
export type BreakdownCode = SurfaceCode | WayTypeCode | SurfaceGroupCode

export const breakdownItemSchema = z.object({
  code: z.string().min(1),
  percentage: z.number().min(0).max(100),
  distanceMeters: z.number().nonnegative(),
})

export const trafficExposureSchema = z.object({
  score: z.number().min(0).max(100),
  label: z.enum(['low', 'moderate', 'high', 'unknown']),
  /**
   * Why the score is what it is, as a code rather than a sentence: this schema
   * is parsed in the adapter, which has no translator.
   */
  rationaleCode: z.enum(['scored', 'partial']),
})

export const liveTrafficSegmentSchema = z.object({
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  // Was `['低', 'modérée', 'élevée', 'inconnue']` — a Chinese character where
  // "faible" belongs, in an enum nothing could ever match.
  congestion: z.enum(['low', 'moderate', 'high', 'unknown']),
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
  recommendationLabel: 'recommended' | 'quieter' | 'training' | 'alternative'
  score: number
}
