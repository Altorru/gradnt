import type { Route, RouteWithScore } from './route'
import { type RoutePreferences, type SurfacePreference } from './route-preferences'
import { routeSchema } from './route'

// A climb needs at least 300 m and 20 m of positive gain. Hysteresis keeps
// gentle sections at or above 1% inside a climb after a 2% start threshold.
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

export function normalizeSurfaceGroup(
  label: string,
): 'paved' | 'compacted' | 'gravel' | 'trail' | 'unknown' {
  const normalized = label.toLowerCase()

  if (
    normalized.includes('asphalt') ||
    normalized.includes('asphalte') ||
    normalized.includes('paved') ||
    normalized.includes('revêt') ||
    normalized.includes('béton') ||
    normalized.includes('pavé')
  ) {
    return 'paved'
  }

  if (normalized.includes('compact')) {
    return 'compacted'
  }

  if (normalized.includes('gravel') || normalized.includes('gravier')) {
    return 'gravel'
  }

  if (
    normalized.includes('dirt') ||
    normalized.includes('terre') ||
    normalized.includes('trail') ||
    normalized.includes('sol') ||
    normalized.includes('piste') ||
    normalized.includes('sentier') ||
    normalized.includes('herbe')
  ) {
    return 'trail'
  }

  return 'unknown'
}

const surfaceGroupLabels = {
  paved: 'Asphalte / revêtu',
  compacted: 'Compacté',
  gravel: 'Gravier',
  trail: 'Terre / sentier',
  unknown: 'Inconnu',
} as const

export function aggregateSurfaceBreakdown(
  breakdown: Route['surfaceBreakdown'],
): Route['surfaceBreakdown'] {
  const grouped = new Map<keyof typeof surfaceGroupLabels, number>()

  for (const item of breakdown) {
    const group = normalizeSurfaceGroup(item.label)
    grouped.set(group, (grouped.get(group) ?? 0) + item.distanceMeters)
  }

  const totalDistance = breakdown.reduce((total, item) => total + item.distanceMeters, 0)
  if (!totalDistance) {
    return breakdown
  }

  return Array.from(grouped.entries()).map(([group, distanceMeters]) => ({
    label: surfaceGroupLabels[group],
    distanceMeters: Math.round(distanceMeters),
    percentage: Math.round((distanceMeters / totalDistance) * 1000) / 10,
  }))
}

export function getTrafficExposure(input: {
  suitability: number
  wayTypeBreakdown: Route['wayTypeBreakdown']
}): Route['trafficExposure'] {
  const cyclewayPercentage =
    input.wayTypeBreakdown.find((item) => item.label === 'Piste cyclable')?.percentage ?? 0
  const mainRoadPercentage =
    input.wayTypeBreakdown.find((item) => item.label === 'Route principale')?.percentage ?? 0
  const score = Math.max(
    0,
    Math.min(100, Math.round(60 - cyclewayPercentage * 0.45 + mainRoadPercentage * 0.55)),
  )

  const label = score <= 30 ? 'low' : score <= 60 ? 'moderate' : 'high'

  return {
    score,
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
  const intent = preferences.plannedWorkoutIntent ?? preferences.trainingIntent

  if (intent === 'climbing') {
    return Math.min(100, route.trainingIntentFit + route.climbs.length * 5)
  }

  if (intent === 'recovery') {
    return Math.max(0, 100 - route.elevationGainMeters / 15)
  }

  if (intent === 'tempo') {
    return Math.min(100, route.trainingIntentFit + (route.distanceMeters >= 25_000 ? 8 : 0))
  }

  return route.trainingIntentFit
}

function surfaceFit(route: Route, preferences: RoutePreferences) {
  const surfaceMix = route.surfaceBreakdown.reduce(
    (mix, item) => {
      const group = normalizeSurfaceGroup(item.label)
      if (group === 'paved') {
        mix.paved += item.percentage
      } else if (group === 'compacted' || group === 'gravel') {
        mix.gravel += item.percentage
      } else if (group === 'trail') {
        mix.trail += item.percentage
      }
      return mix
    },
    { paved: 0, gravel: 0, trail: 0 },
  )

  const preferenceScore: Record<SurfacePreference, number> = {
    paved: surfaceMix.paved,
    mixed: Math.max(0, 100 - Math.abs(surfaceMix.gravel + surfaceMix.trail - 30)),
    gravel: surfaceMix.gravel,
    trail: surfaceMix.trail,
  }

  return preferenceScore[preferences.surfacePreference]
}

export function scoreRoute(route: Route, preferences: RoutePreferences): RouteWithScore {
  const trafficScore = preferences.lowTraffic ? 100 - route.trafficExposure.score : 70
  const score = Math.round(
    distanceFit(route, preferences) * 0.25 +
      elevationFit(route, preferences) * 0.15 +
      surfaceFit(route, preferences) * 0.15 +
      intentFit(route, preferences) * 0.3 +
      trafficScore * 0.15,
  )

  return {
    ...routeSchema.parse(route),
    trainingIntent: preferences.plannedWorkoutIntent ?? preferences.trainingIntent,
    trainingIntentFit: Math.round(intentFit(route, preferences)),
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

  const recommended = ranked[0]

  return ranked.map((route, index) => {
    if (index === 0) {
      return { ...route, recommendationLabel: 'recommended' as const }
    }

    const isQuieter = recommended
      ? route.trafficExposure.score < recommended.trafficExposure.score
      : false
    const hasMoreClimbing = recommended
      ? route.elevationGainMeters > recommended.elevationGainMeters
      : false

    return {
      ...route,
      recommendationLabel: isQuieter
        ? ('quieter' as const)
        : hasMoreClimbing
          ? ('training' as const)
          : ('alternative' as const),
    }
  })
}
