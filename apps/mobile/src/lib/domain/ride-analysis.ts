import type { Activity } from './schemas'

export type RideAnalysisConfidence = 'power' | 'duration'
export type RideIntensity = 'recovery' | 'endurance' | 'tempo' | 'threshold' | 'high'

export type RideAnalysis = {
  confidence: RideAnalysisConfidence
  intensity: RideIntensity
  loadScore: number
  comparedRides: number
  facts: {
    durationMinutes: number
    distanceKm: number
    elevationMeters: number
    powerWatts: number | null
    intensityFactor: number | null
  }
  trend: 'above' | 'near' | 'below' | 'first'
  nextAction: 'recover' | 'endurance' | 'progress'
}

/**
 * A transparent first analysis layer. Every number is calculated here; the AI
 * will later explain this structured result, never invent it.
 */
export function analyzeRide(
  activity: Activity,
  history: Activity[],
  ftp: number | null,
  feedback?: { perceivedEffort: number | null; fatigue: 'low' | 'moderate' | 'high' | null },
): RideAnalysis {
  const power = activity.normalizedPower ?? activity.weightedPower ?? activity.averagePower
  const intensityFactor = power !== null && ftp !== null && ftp > 0 ? power / ftp : null
  const intensity = intensityFor(intensityFactor, activity.durationSeconds)
  const loadScore = Math.round(
    (activity.durationSeconds / 3600) * 100 * (intensityFactor === null ? 1 : intensityFactor ** 2),
  )
  const previous = history.filter(
    (candidate) =>
      candidate.id !== activity.id && Date.parse(candidate.startAt) < Date.parse(activity.startAt),
  )
  const recent = previous.slice(0, 5)
  const averageLoad =
    recent.length === 0
      ? null
      : recent.reduce((total, candidate) => total + simpleLoad(candidate, ftp), 0) / recent.length
  const trend =
    averageLoad === null
      ? 'first'
      : loadScore > averageLoad * 1.15
        ? 'above'
        : loadScore < averageLoad * 0.85
          ? 'below'
          : 'near'
  const nextAction =
    feedback?.fatigue === 'high' ||
    (feedback?.perceivedEffort ?? 0) >= 8 ||
    intensity === 'high' ||
    intensity === 'threshold'
      ? 'recover'
      : intensity === 'recovery' || intensity === 'endurance'
        ? 'progress'
        : 'endurance'
  return {
    confidence: intensityFactor === null ? 'duration' : 'power',
    intensity,
    loadScore,
    comparedRides: recent.length,
    facts: {
      durationMinutes: Math.round(activity.durationSeconds / 60),
      distanceKm: Math.round((activity.distanceMeters / 1000) * 10) / 10,
      elevationMeters: Math.round(activity.elevationGainMeters),
      powerWatts: power === null ? null : Math.round(power),
      intensityFactor: intensityFactor === null ? null : Math.round(intensityFactor * 100) / 100,
    },
    trend,
    nextAction,
  }
}

function simpleLoad(activity: Activity, ftp: number | null): number {
  const power = activity.normalizedPower ?? activity.weightedPower ?? activity.averagePower
  const factor = power !== null && ftp !== null && ftp > 0 ? power / ftp : 1
  return (activity.durationSeconds / 3600) * 100 * factor ** 2
}

function intensityFor(factor: number | null, durationSeconds: number): RideIntensity {
  if (factor === null) return durationSeconds < 45 * 60 ? 'recovery' : 'endurance'
  if (factor < 0.55) return 'recovery'
  if (factor < 0.75) return 'endurance'
  if (factor < 0.9) return 'tempo'
  if (factor < 1.05) return 'threshold'
  return 'high'
}
