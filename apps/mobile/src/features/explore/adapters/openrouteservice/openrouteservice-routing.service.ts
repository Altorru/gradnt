import { z } from 'zod'

import {
  aggregateSurfaceBreakdown,
  detectClimbs,
  getTrafficExposure,
  midpointOf,
  rankRouteProposals,
  routeSchema,
  type BreakdownItem,
  type Route,
  type RouteWithScore,
} from '../../domain'
import type { RouteMode } from '../../domain/route-preferences'
import type { RouteRequest, RoutingService } from '../../services/routing-service'

// HeiGIT hosts OpenRouteService under `/openrouteservice` on this host. Without
// that prefix the path does not exist and answers 404 — which the routing call
// then reported as `HEIGIT_HTTP_404`, a wrong address rather than a wrong key.
const heigitEndpoint = 'https://api.heigit.org/openrouteservice/v2/directions'

const extraSummarySchema = z.object({
  value: z.number(),
  distance: z.number().nonnegative(),
  amount: z.number().min(0).max(100),
})

const extraInfoSchema = z
  .object({
    values: z.array(z.tuple([z.number().int(), z.number().int(), z.number()])).optional(),
    summary: z.array(extraSummarySchema).optional(),
  })
  .passthrough()

const heigitFeatureSchema = z
  .object({
    geometry: z.object({
      coordinates: z.array(z.array(z.number()).min(2)).min(2),
    }),
    properties: z
      .object({
        summary: z
          .object({
            distance: z.number().nonnegative(),
            duration: z.number().nonnegative(),
            // The service answers with `null` here even when it has a figure,
            // and `.optional()` accepts `undefined` but not `null` — so every
            // real response failed to parse. The values that are actually
            // populated sit on `properties`, read below.
            ascent: z.number().nonnegative().nullable().optional(),
            descent: z.number().nonnegative().nullable().optional(),
          })
          .optional(),
        ascent: z.number().nonnegative().nullable().optional(),
        descent: z.number().nonnegative().nullable().optional(),
        extras: z
          .object({
            surface: extraInfoSchema.optional(),
            waytypes: extraInfoSchema.optional(),
            waytype: extraInfoSchema.optional(),
            suitability: extraInfoSchema.optional(),
            steepness: extraInfoSchema.optional(),
            traildifficulty: extraInfoSchema.optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough(),
  })
  .passthrough()

const heigitResponseSchema = z
  .object({
    features: z.array(heigitFeatureSchema).min(1),
  })
  .passthrough()

type HeigitFeature = z.infer<typeof heigitFeatureSchema>
type HeigitExtraSummary = z.infer<typeof extraSummarySchema>

/**
 * What the engine accepts for a round trip, in metres.
 *
 * Its own words: "The requested route length must not be greater than
 * 100000.0 meters". Asking for more is a 400, which the screen reports as
 * a failure to load — so it is clamped here rather than left to the caller
 * to get right.
 */
const MAX_ROUND_TRIP_LENGTH_METERS = 100_000

const heigitProfileByMode: Record<RouteMode, string> = {
  road: 'cycling-road',
  gravel: 'cycling-regular',
  mtb: 'cycling-mountain',
}

const surfaceLabels: Record<number, string> = {
  0: 'Inconnue',
  1: 'Revêtue',
  2: 'Non revêtue',
  3: 'Asphalte',
  4: 'Béton',
  5: 'Pavés',
  6: 'Métal',
  7: 'Bois',
  8: 'Gravier compacté',
  9: 'Gravier fin',
  10: 'Gravier',
  11: 'Terre',
  12: 'Sol naturel',
  13: 'Neige/glace',
  14: 'Pavés béton',
  15: 'Sable',
  16: 'Copeaux',
  17: 'Herbe',
  18: 'Dalles engazonnées',
}

const wayTypeLabels: Record<number, string> = {
  0: 'Voie inconnue',
  1: 'Route principale',
  2: 'Route secondaire',
  3: 'Rue',
  4: 'Chemin',
  5: 'Piste',
  6: 'Piste cyclable',
  7: 'Voie piétonne',
  8: 'Escaliers',
  9: 'Ferry',
  10: 'Travaux',
}

function getApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_HEIGIT_API_KEY
  return key?.trim() ? key.trim() : null
}

function getDistanceBetweenPoints(first: [number, number], second: [number, number]): number {
  const latitudeFactor = 111_320
  const longitudeFactor = 111_320 * Math.cos((first[1] * Math.PI) / 180)
  const deltaLongitude = (second[0] - first[0]) * longitudeFactor
  const deltaLatitude = (second[1] - first[1]) * latitudeFactor
  return Math.sqrt(deltaLongitude ** 2 + deltaLatitude ** 2)
}

function toBreakdown(
  summaries: HeigitExtraSummary[] | undefined,
  labels: Record<number, string>,
  fallbackLabel: string,
  routeDistanceMeters: number,
): BreakdownItem[] {
  if (!summaries?.length) {
    return [{ label: fallbackLabel, percentage: 100, distanceMeters: routeDistanceMeters }]
  }

  return summaries.map((item) => ({
    label: labels[item.value] ?? `${fallbackLabel} ${item.value}`,
    percentage: Math.round(item.amount * 10) / 10,
    distanceMeters: Math.round(item.distance),
  }))
}

function getAverageExtraValue(summaries: HeigitExtraSummary[] | undefined) {
  if (!summaries?.length) {
    return null
  }

  const totalDistance = summaries.reduce((total, item) => total + item.distance, 0)
  if (!totalDistance) {
    return summaries[0]?.value ?? null
  }

  return summaries.reduce((total, item) => total + item.value * item.distance, 0) / totalDistance
}

function normalizeFeature(feature: HeigitFeature, request: RouteRequest, index: number): Route {
  const summary = feature.properties.summary
  const extras = feature.properties.extras
  const geometry = feature.geometry.coordinates.map((coordinate) => ({
    longitude: coordinate[0],
    latitude: coordinate[1],
    elevationMeters: coordinate[2] ?? null,
  }))

  const elevationProfile = geometry.reduce<Route['elevationProfile']>(
    (profile, point, pointIndex) => {
      if (point.elevationMeters === null) {
        return profile
      }

      const previous = geometry[pointIndex - 1]
      const previousDistance = profile.at(-1)?.distanceMeters ?? 0
      const segmentDistance = previous
        ? getDistanceBetweenPoints(
            [previous.longitude, previous.latitude],
            [point.longitude, point.latitude],
          )
        : 0

      profile.push({
        distanceMeters: previousDistance + segmentDistance,
        elevationMeters: point.elevationMeters,
      })
      return profile
    },
    [],
  )

  const usableProfile =
    elevationProfile.length >= 2
      ? elevationProfile
      : [
          { distanceMeters: 0, elevationMeters: 0 },
          { distanceMeters: summary?.distance ?? 0, elevationMeters: 0 },
        ]
  const distanceMeters = summary?.distance ?? usableProfile.at(-1)?.distanceMeters ?? 0
  const wayTypeBreakdown = toBreakdown(
    extras?.waytypes?.summary ?? extras?.waytype?.summary,
    wayTypeLabels,
    'Type de voie',
    distanceMeters,
  )
  const suitabilityValue = getAverageExtraValue(extras?.suitability?.summary)
  const suitability = suitabilityValue === null ? 78 : Math.round((suitabilityValue / 10) * 100)
  const trafficExposure = getTrafficExposure({ suitability, wayTypeBreakdown })

  return routeSchema.parse({
    id: `heigit-route-${index + 1}`,
    name: `Parcours HeiGIT ${index + 1}`,
    mode: request.preferences.mode,
    geometry,
    distanceMeters,
    durationSeconds: Math.round(summary?.duration ?? 0),
    // `summary` first for completeness, but it is `null` in practice: the
    // service reports the climb on `properties`.
    elevationGainMeters: summary?.ascent ?? feature.properties.ascent ?? 0,
    elevationLossMeters: summary?.descent ?? feature.properties.descent ?? 0,
    elevationProfile: usableProfile,
    climbs: detectClimbs(usableProfile),
    surfaceBreakdown: aggregateSurfaceBreakdown(
      toBreakdown(extras?.surface?.summary, surfaceLabels, 'Surface', distanceMeters),
    ),
    wayTypeBreakdown,
    suitability: Math.min(100, Math.max(0, suitability)),
    trafficExposure: {
      ...trafficExposure,
      rationale: `Exposition routière calculée à partir des données OSM HeiGIT. ${trafficExposure.rationale}`,
    },
    liveTraffic: [],
    trainingIntentFit: request.preferences.trainingIntent === 'climbing' ? 88 : 78,
    provider: {
      name: 'openrouteservice',
      profile: heigitProfileByMode[request.preferences.mode],
    },
  })
}

export function normalizeHeigitFeature(feature: unknown, request: RouteRequest, index = 0) {
  return normalizeFeature(heigitFeatureSchema.parse(feature), request, index)
}

export class HeigitRoutingService implements RoutingService {
  constructor(private readonly apiKey = getApiKey()) {}

  isConfigured() {
    return Boolean(this.apiKey)
  }

  async getProposals(request: RouteRequest): Promise<RouteWithScore[]> {
    if (!this.apiKey) {
      throw new Error('HEIGIT_API_KEY_NOT_CONFIGURED')
    }

    const profile = heigitProfileByMode[request.preferences.mode]
    const apiKey = this.apiKey
    const seeds = [17, 31, 73]
    const responses = await Promise.all(
      seeds.map((seed) =>
        fetch(`${heigitEndpoint}/${profile}/geojson`, {
          method: 'POST',
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            coordinates: request.preferences.loop
              ? [[request.start.longitude, request.start.latitude]]
              : [
                  [request.start.longitude, request.start.latitude],
                  [request.start.longitude, request.start.latitude],
                ],
            elevation: true,
            instructions: false,
            extra_info: ['surface', 'waytype', 'steepness', 'suitability'],
            ...(request.preferences.loop
              ? {
                  options: {
                    round_trip: {
                      length: Math.min(
                        midpointOf(request.preferences.distanceRangeKm) * 1000,
                        MAX_ROUND_TRIP_LENGTH_METERS,
                      ),
                      points: 3,
                      seed,
                    },
                  },
                }
              : {}),
          }),
        }),
      ),
    )

    const failedResponse = responses.find((response) => !response.ok)
    if (failedResponse) {
      throw new Error(`HEIGIT_HTTP_${failedResponse.status}`)
    }

    const payloads = await Promise.all(
      responses.map((response) => response.json() as Promise<unknown>),
    )
    const routes = payloads.flatMap((payload, responseIndex) => {
      const parsed = heigitResponseSchema.parse(payload)
      return parsed.features.map((feature, featureIndex) =>
        normalizeFeature(feature, request, responseIndex * 10 + featureIndex),
      )
    })

    return rankRouteProposals(routes, request.preferences)
  }
}

export const heigitRoutingService = new HeigitRoutingService()
