import type { Activity, ActivityProvenance } from './schemas'

export type ActivitySource = Activity['source']
export type CoachMode = 'deterministic' | 'ai'

/**
 * The source policy is a product boundary, not a UI convenience. Strava rides
 * can power GRADNT's verified local facts and deterministic plan logic, but
 * cannot be sent to an AI provider. FIT, Garmin and manual data are owned or
 * explicitly supplied to GRADNT and can use the AI Coach.
 */
export function coachModeForSource(source: ActivitySource): CoachMode {
  return source === 'strava' ? 'deterministic' : 'ai'
}

export function canUseAiForSource(source: ActivitySource): boolean {
  return coachModeForSource(source) === 'ai'
}

export function provenanceForSource(
  source: ActivitySource,
  collectedAt = new Date().toISOString(),
): ActivityProvenance {
  return {
    provider: source === 'strava' || source === 'garmin' ? source : 'user',
    consentGrantedAt: source === 'manual' || source === 'file' ? collectedAt : null,
    collectedAt,
    freshness: 'current',
    attribution: source === 'garmin' ? 'Garmin Connect' : null,
  }
}

/** AI requires a complete, source-specific provenance record. */
export function canUseAiForActivity(
  activity: Pick<Activity, 'source' | 'provenanceDetails'>,
): boolean {
  if (!canUseAiForSource(activity.source)) return false
  const details = activity.provenanceDetails
  if (!details || details.freshness !== 'current') return false
  if (activity.source === 'garmin') {
    return details.provider === 'garmin' && details.attribution === 'Garmin Connect'
  }
  return details.provider === 'user'
}

export function sourcePolicyLabel(
  source: ActivitySource,
): 'strava_deterministic' | 'garmin_ai' | 'file_ai' | 'manual_ai' {
  switch (source) {
    case 'strava':
      return 'strava_deterministic'
    case 'garmin':
      return 'garmin_ai'
    case 'file':
      return 'file_ai'
    case 'manual':
      return 'manual_ai'
  }
}
