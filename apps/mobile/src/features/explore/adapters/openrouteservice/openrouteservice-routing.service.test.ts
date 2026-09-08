import { describe, expect, it } from 'vitest'

import { normalizeHeigitFeature } from './openrouteservice-routing.service'
import type { RouteRequest } from '../../services'

const request: RouteRequest = {
  start: {
    latitude: 45.764,
    longitude: 4.835,
    elevationMeters: 171,
  },
  preferences: {
    mode: 'road',
    targetDistanceKm: 20,
    targetElevationGainMeters: 200,
    lowTraffic: true,
    surfacePreference: 'paved',
    trainingIntent: 'endurance',
    plannedWorkoutIntent: 'endurance',
    loop: true,
  },
}

describe('HeiGIT route normalization', () => {
  it('normalizes geometry, elevation and OSM extras into GRADNT fields', () => {
    const route = normalizeHeigitFeature(
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [4.835, 45.764, 170],
            [4.85, 45.78, 210],
            [4.87, 45.8, 220],
          ],
        },
        properties: {
          summary: {
            distance: 20_000,
            duration: 3_000,
            ascent: 60,
            descent: 60,
          },
          extras: {
            surface: {
              summary: [
                { value: 3, distance: 16_000, amount: 80 },
                { value: 10, distance: 4_000, amount: 20 },
              ],
            },
            waytypes: {
              summary: [
                { value: 2, distance: 15_000, amount: 75 },
                { value: 6, distance: 5_000, amount: 25 },
              ],
            },
            suitability: {
              summary: [{ value: 8, distance: 20_000, amount: 100 }],
            },
          },
        },
      },
      request,
    )

    expect(route.provider).toEqual({ name: 'openrouteservice', profile: 'cycling-road' })
    expect(route.geometry).toHaveLength(3)
    expect(route.elevationProfile).toHaveLength(3)
    expect(route.surfaceBreakdown).toEqual([
      { label: 'Asphalte / revêtu', percentage: 80, distanceMeters: 16_000 },
      { label: 'Gravier', percentage: 20, distanceMeters: 4_000 },
    ])
    expect(route.wayTypeBreakdown[0]).toEqual({
      label: 'Route secondaire',
      percentage: 75,
      distanceMeters: 15_000,
    })
    expect(route.suitability).toBe(80)
  })
})
