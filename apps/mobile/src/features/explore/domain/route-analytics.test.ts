import { describe, expect, it } from 'vitest'
import {
  rangeFit,
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
      elevationRangeM: { min: 600, max: 800 },
      trainingIntent: 'climbing',
      plannedWorkoutIntent: 'climbing',
    })

    expect(ranked[0]?.id).toBe('route-climbing')
    expect(ranked[0]?.trainingIntent).toBe('climbing')
    expect(ranked[0]?.recommendationLabel).toBe('recommended')
  })
})

describe('rangeFit', () => {
  const span = { min: 40, max: 90 }

  it('treats everything inside the span as equally right', () => {
    // A rider asking for 40–90 km wants a ride of about that length, not a
    // route that hits a number. Scoring by distance from a single figure
    // punished the ends of a span that was explicitly chosen.
    expect(rangeFit(40, span)).toBe(100)
    expect(rangeFit(65, span)).toBe(100)
    expect(rangeFit(90, span)).toBe(100)
  })

  it('falls away once past an edge', () => {
    expect(rangeFit(30, span)).toBeLessThan(100)
    expect(rangeFit(100, span)).toBeLessThan(100)
  })

  it('ranks a route just over the line above one far beyond it', () => {
    expect(rangeFit(95, span)).toBeGreaterThan(rangeFit(140, span))
  })

  it('uses the span as the scale, so a wide span forgives more', () => {
    const narrow = { min: 40, max: 50 }
    const wide = { min: 20, max: 120 }

    expect(rangeFit(70, wide)).toBeGreaterThan(rangeFit(70, narrow))
  })

  it('never goes below zero, however far past the edge', () => {
    expect(rangeFit(1000, span)).toBe(0)
  })

  it('has no span to fall back on, so it stays exact', () => {
    // A single-value span is a legitimate ask — "about 60 km" — and one step
    // off it should cost something rather than nothing.
    expect(rangeFit(60, { min: 60, max: 60 })).toBe(100)
    expect(rangeFit(61, { min: 60, max: 60 })).toBeLessThan(100)
  })
})
