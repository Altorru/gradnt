import { z } from 'zod'

import {
  detectClimbs,
  getTrafficExposure,
  rankRouteProposals,
  routeSchema,
  type Route,
  type RouteWithScore,
} from '../../domain'
import type { RouteRequest, RoutingService } from '../../services/routing-service'
import type { RouteMode } from '../../domain/route-preferences'

const heigitEndpoint = 'https://api.heigit.org/v2/directions'

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
            ascent: z.number().nonnegative().optional(),
            descent: z.number().nonnegative().optional(),
          })
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

const heigitProfileByMode: Record<RouteMode, string> = {
  road: 'cycling-road',
  gravel: 'cycling-regular',
  mtb: 'cycling-mountain',
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

function normalizeFeature(feature: HeigitFeature, request: RouteRequest, index: number): Route {
  const summary = feature.properties.summary
  const geometry = feature.geometry.coordinates.map((coordinate) => ({
    longitude: coordinate[0],
    latitude: coordinate[1],
    elevationMeters: coordinate[2] ?? null,
  }))

  const elevationProfile = geometry.reduce<Route['elevationProfile']>(
    (profile, point, pointIndex) => {
      const previous = geometry[pointIndex - 1]
      const previousDistance = profile[pointIndex - 1]?.distanceMeters ?? 0
      const segmentDistance = previous
        ? getDistanceBetweenPoints(
            [previous.longitude, previous.latitude],
            [point.longitude, point.latitude],
          )
        : 0

      if (point.elevationMeters === null) {
        return profile
      }

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
  const wayTypeBreakdown = [{ label: 'Voie à analyser', percentage: 100 }]
  const suitability =
    request.preferences.mode === 'mtb' ? 72 : request.preferences.mode === 'gravel' ? 76 : 82
  const trafficExposure = getTrafficExposure({
    suitability,
    wayTypeBreakdown,
    lowTraffic: request.preferences.lowTraffic,
  })

  return routeSchema.parse({
    id: `heigit-route-${index + 1}`,
    name: `Parcours ${index + 1}`,
    mode: request.preferences.mode,
    geometry,
    distanceMeters,
    durationSeconds: Math.round(summary?.duration ?? 0),
    elevationGainMeters: summary?.ascent ?? 0,
    elevationLossMeters: summary?.descent ?? 0,
    elevationProfile: usableProfile,
    climbs: detectClimbs(usableProfile),
    surfaceBreakdown: [{ label: 'Données ORS à détailler', percentage: 100 }],
    wayTypeBreakdown,
    suitability,
    trafficExposure,
    liveTraffic: [],
    trainingIntentFit: request.preferences.trainingIntent === 'climbing' ? 88 : 78,
    provider: {
      name: 'openrouteservice',
      profile: heigitProfileByMode[request.preferences.mode],
    },
  })
}

export class HeigitRoutingService implements RoutingService {
  constructor(private readonly apiKey = getApiKey()) {}

  async getProposals(request: RouteRequest): Promise<RouteWithScore[]> {
    if (!this.apiKey) {
      throw new Error('HEIGIT_API_KEY_NOT_CONFIGURED')
    }

    const profile = heigitProfileByMode[request.preferences.mode]
    const response = await fetch(`${heigitEndpoint}/${profile}/geojson`, {
      method: 'POST',
      headers: {
        Authorization: this.apiKey,
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
                  length: request.preferences.targetDistanceKm * 1000,
                  points: 3,
                  seed: 1,
                },
              },
            }
          : {}),
      }),
    })

    if (!response.ok) {
      throw new Error(`HEIGIT_HTTP_${response.status}`)
    }

    const payload: unknown = await response.json()
    const parsed = heigitResponseSchema.parse(payload)
    return rankRouteProposals(
      parsed.features.map((feature, index) => normalizeFeature(feature, request, index)),
      request.preferences,
    )
  }
}

export const heigitRoutingService = new HeigitRoutingService()
