import type { Route, RouteWithScore } from './route'
import type { RoutePreferences } from './route-preferences'
import { routeSchema } from './route'

const minimumClimbLengthMeters = 300
const minimumClimbGainMeters = 20
const climbStartGradientPercent = 2
const climbEndGradientPercent = 1

type ClimbAccumulator = {
  startIndex: number
  endIndex: number
  gainMeters: number
  maximumGradientPercent: number
}

function gradientBetween(startElevation: number, endElevation: number, distanceMeters: number) {
  if (distanceMeters <= 0) {
    return 0
  }

  return ((endElevation - startElevation) / distanceMeters) * 100
}

function toClimb(profile: Route['elevationProfile'], accumulator: ClimbAccumulator, index: number) {
  const start = profile[accumulator.startIndex]
  const end = profile[accumulator.endIndex]
  const lengthMeters = end.distanceMeters - start.distanceMeters

  if (lengthMeters < minimumClimbLengthMeters || accumulator.gainMeters < minimumClimbGainMeters) {
    return null
  }

  const averageGradientPercent = (accumulator.gainMeters / lengthMeters) * 100
  const difficultyScore = Math.min(
    100,
    Math.round(
      Math.min(55, (lengthMeters / 1000) * 8) +
        Math.min(30, averageGradientPercent * 6) +
        Math.min(15, accumulator.maximumGradientPercent * 1.5),
    ),
  )

  return {
    id: `climb-${index + 1}`,
    startDistanceMeters: start.distanceMeters,
    endDistanceMeters: end.distanceMeters,
    lengthMeters,
    elevationGainMeters: Math.round(accumulator.gainMeters),
    averageGradientPercent: Math.round(averageGradientPercent * 10) / 10,
    maximumGradientPercent: Math.round(accumulator.maximumGradientPercent * 10) / 10,
    difficultyScore,
  }
}

export function detectClimbs(profile: Route['elevationProfile']): Route['climbs'] {
  const climbs: Route['climbs'] = []
  let current: ClimbAccumulator | null = null

  for (let index = 1; index < profile.length; index += 1) {
    const previous = profile[index - 1]
    const point = profile[index]
    const segmentLength = point.distanceMeters - previous.distanceMeters
    const segmentGain = Math.max(0, point.elevationMeters - previous.elevationMeters)
    const segmentGradient = gradientBetween(
      previous.elevationMeters,
      point.elevationMeters,
      segmentLength,
    )

    if (segmentGradient >= climbStartGradientPercent) {
      if (!current) {
        current = {
          startIndex: index - 1,
          endIndex: index,
          gainMeters: segmentGain,
          maximumGradientPercent: segmentGradient,
        }
      } else {
        current.endIndex = index
        current.gainMeters += segmentGain
        current.maximumGradientPercent = Math.max(current.maximumGradientPercent, segmentGradient)
      }
      continue
    }

    if (current && segmentGradient >= climbEndGradientPercent) {
      current.endIndex = index
      current.gainMeters += segmentGain
      current.maximumGradientPercent = Math.max(current.maximumGradientPercent, segmentGradient)
      continue
    }

    if (current) {
      const climb = toClimb(profile, current, climbs.length)
      if (climb) {
        climbs.push(climb)
      }
      current = null
    }
  }

  if (current) {
    const climb = toClimb(profile, current, climbs.length)
    if (climb) {
      climbs.push(climb)
    }
  }

  return climbs
}

export function getTrafficExposure(input: {
  suitability: number
  wayTypeBreakdown: Route['wayTypeBreakdown']
  lowTraffic: boolean
}): Route['trafficExposure'] {
  const cyclewayPercentage =
    input.wayTypeBreakdown.find((item) => item.label === 'Piste cyclable')?.percentage ?? 0
  const mainRoadPercentage =
    input.wayTypeBreakdown.find((item) => item.label === 'Route principale')?.percentage ?? 0
  const score = Math.max(
    0,
    Math.min(100, Math.round(60 - cyclewayPercentage * 0.45 + mainRoadPercentage * 0.55)),
  )

  const adjustedScore = input.lowTraffic ? score : Math.max(0, score - 5)
  const label = adjustedScore <= 30 ? 'low' : adjustedScore <= 60 ? 'moderate' : 'high'

  return {
    score: adjustedScore,
    label,
    rationale:
      input.suitability >= 70
        ? 'Score basé sur la compatibilité cyclable et les types de voies disponibles.'
        : 'Score prudent : la compatibilité cyclable des voies est partielle.',
  }
}

function distanceFit(route: Route, preferences: RoutePreferences) {
  const difference = Math.abs(route.distanceMeters / 1000 - preferences.targetDistanceKm)
  return Math.max(0, 100 - (difference / Math.max(preferences.targetDistanceKm, 1)) * 100)
}

function elevationFit(route: Route, preferences: RoutePreferences) {
  if (preferences.targetElevationGainMeters === 0) {
    return 100
  }

  const difference = Math.abs(route.elevationGainMeters - preferences.targetElevationGainMeters)
  return Math.max(0, 100 - (difference / preferences.targetElevationGainMeters) * 100)
}

function intentFit(route: Route, preferences: RoutePreferences) {
  if (preferences.trainingIntent === 'climbing') {
    return Math.min(100, route.trainingIntentFit + route.climbs.length * 5)
  }

  if (preferences.trainingIntent === 'recovery') {
    return Math.max(0, 100 - route.elevationGainMeters / 15)
  }

  return route.trainingIntentFit
}

export function scoreRoute(route: Route, preferences: RoutePreferences): RouteWithScore {
  const trafficScore = preferences.lowTraffic ? 100 - route.trafficExposure.score : 70
  const score = Math.round(
    distanceFit(route, preferences) * 0.3 +
      elevationFit(route, preferences) * 0.2 +
      intentFit(route, preferences) * 0.3 +
      trafficScore * 0.2,
  )

  return {
    ...routeSchema.parse(route),
    trainingIntent: preferences.trainingIntent,
    recommendationLabel: 'recommended',
    score,
  }
}

export function rankRouteProposals(
  routes: Route[],
  preferences: RoutePreferences,
): RouteWithScore[] {
  const ranked = routes
    .map((route) => scoreRoute(route, preferences))
    .sort((a, b) => b.score - a.score)

  return ranked.map((route, index) => ({
    ...route,
    recommendationLabel: index === 0 ? 'recommended' : index === 1 ? 'quieter' : 'training',
  }))
}
