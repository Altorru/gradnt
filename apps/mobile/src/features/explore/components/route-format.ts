import type { MessageKey, Translate } from '@/i18n'

import type { RouteWithScore } from '../domain'

/**
 * Presentation helpers for the Explore screen.
 *
 * Pulled out of the screen so they can be tested without rendering anything,
 * and so the result strip and the detail panel cannot drift into formatting the
 * same figure two different ways — which is exactly what happened while the
 * distance, duration and elevation formats lived inline in one component.
 */

/** Kilometres, French decimal comma. `62,4 km` */
export function formatDistance(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`
}

/** `+480 m` — the sign matters on a climb figure. */
export function formatElevation(elevationGainMeters: number): string {
  return `+${elevationGainMeters} m`
}

/** `1 h 15` — minutes only under the hour. */
export function formatDuration(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!hours) {
    return `${minutes} min`
  }

  return `${hours} h${remainingMinutes ? ` ${remainingMinutes} min` : ''}`
}

export function recommendationLabels(
  t: Translate,
): Record<RouteWithScore['recommendationLabel'], string> {
  return {
    recommended: t('explore.recommendation.recommended'),
    quieter: t('explore.recommendation.quieter'),
    training: t('explore.recommendation.training'),
    alternative: t('explore.recommendation.alternative'),
  }
}

/**
 * How well a route matches what the rider asked for, as a key.
 *
 * A key rather than a sentence: this is a domain-ish comparison, and the words
 * belong to whoever renders them.
 */
export function getTrainingFitKey(score: number): MessageKey {
  return score >= 85 ? 'explore.fit.great' : score >= 70 ? 'explore.fit.good' : 'explore.fit.adjust'
}
