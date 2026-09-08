import { describe, expect, it } from 'vitest'

import {
  aggregateSurfaceBreakdown,
  detectClimbs,
  getTrafficExposure,
  rankRouteProposals,
} from './route-analytics'
import type { Route } from './route'
import { defaultRoutePreferences } from './route-preferences'

const routeBase: Route = {
  id: 'route-test',
  name: 'Route test',
  mode: 'road',
  geometry: [
    { latitude: 45, longitude: 4, elevationMeters: 100 },
    { latitude: 45.01, longitude: 4.01, elevationMeters: 100 },
  ],
  distanceMeters: 30_000,
  durationSeconds: 4_000,
  elevationGainMeters: 300,
  elevationLossMeters: 300,
  elevationProfile: [
    { distanceMeters: 0, elevationMeters: 100 },
    { distanceMeters: 10_000, elevationMeters: 300 },
    { distanceMeters: 20_000, elevationMeters: 200 },
  ],
  climbs: [],
  surfaceBreakdown: [
    { label: 'Asphalte', percentage: 70, distanceMeters: 21_000 },
    { label: 'Gravier fin', percentage: 20, distanceMeters: 6_000 },
    { label: 'Terre', percentage: 10, distanceMeters: 3_000 },
  ],
  wayTypeBreakdown: [
    { label: 'Route secondaire', percentage: 70, distanceMeters: 21_000 },
    { label: 'Piste cyclable', percentage: 20, distanceMeters: 6_000 },
    { label: 'Route principale', percentage: 10, distanceMeters: 3_000 },
  ],
  suitability: 88,
  trafficExposure: {
    score: 25,
    label: 'low',
    rationale: 'Test',
  },
  liveTraffic: [],
  trainingIntentFit: 90,
  provider: { name: 'mock', profile: 'test' },
}

describe('route analytics', () => {
  it('detects a climb only when length and gain thresholds are met', () => {
    const climbs = detectClimbs(routeBase.elevationProfile)

    expect(climbs).toHaveLength(1)
    expect(climbs[0]).toMatchObject({
      startDistanceMeters: 0,
      endDistanceMeters: 10_000,
      lengthMeters: 10_000,
      elevationGainMeters: 200,
    })
  })

  it('does not treat a short rise as a climb', () => {
    expect(
      detectClimbs([
        { distanceMeters: 0, elevationMeters: 100 },
        { distanceMeters: 250, elevationMeters: 110 },
        { distanceMeters: 600, elevationMeters: 115 },
      ]),
    ).toEqual([])
  })

  it('aggregates source surfaces into user-facing groups with lengths', () => {
    expect(aggregateSurfaceBreakdown(routeBase.surfaceBreakdown)).toEqual([
      { label: 'Asphalte / revêtu', percentage: 70, distanceMeters: 21_000 },
      { label: 'Gravier', percentage: 20, distanceMeters: 6_000 },
      { label: 'Terre / sentier', percentage: 10, distanceMeters: 3_000 },
    ])
  })

  it('scores lower road exposure for cycling infrastructure', () => {
    const exposure = getTrafficExposure({
      suitability: 90,
      wayTypeBreakdown: [
        { label: 'Piste cyclable', percentage: 80, distanceMeters: 24_000 },
        { label: 'Route principale', percentage: 5, distanceMeters: 1_500 },
      ],
    })

    expect(exposure.score).toBeLessThanOrEqual(30)
    expect(exposure.label).toBe('low')
  })

  it('ranks a route and preserves the planned workout intent', () => {
    const climbingRoute = {
      ...routeBase,
      id: 'route-climbing',
      elevationGainMeters: 700,
      trainingIntentFit: 95,
    }
    const ranked = rankRouteProposals([routeBase, climbingRoute], {
      ...defaultRoutePreferences,
      targetElevationGainMeters: 700,
      trainingIntent: 'climbing',
      plannedWorkoutIntent: 'climbing',
    })

    expect(ranked[0]?.id).toBe('route-climbing')
    expect(ranked[0]?.trainingIntent).toBe('climbing')
    expect(ranked[0]?.recommendationLabel).toBe('recommended')
  })
})
