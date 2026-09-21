import { describe, expect, it } from 'vitest'

import {
  canUseAiForActivity,
  canUseAiForSource,
  coachModeForSource,
  provenanceForSource,
  sourcePolicyLabel,
} from './source-policy'

describe('source policy', () => {
  it('keeps Strava in deterministic Coach mode', () => {
    expect(coachModeForSource('strava')).toBe('deterministic')
    expect(canUseAiForSource('strava')).toBe(false)
    expect(sourcePolicyLabel('strava')).toBe('strava_deterministic')
  })

  it('creates source-specific provenance details', () => {
    expect(provenanceForSource('file', '2026-09-21T10:00:00.000Z')).toEqual({
      provider: 'user',
      consentGrantedAt: '2026-09-21T10:00:00.000Z',
      collectedAt: '2026-09-21T10:00:00.000Z',
      freshness: 'current',
      attribution: null,
    })
    expect(provenanceForSource('garmin', '2026-09-21T10:00:00.000Z').attribution).toBe(
      'Garmin Connect',
    )
  })

  it('requires complete provenance before allowing AI', () => {
    expect(
      canUseAiForActivity({ source: 'file', provenanceDetails: provenanceForSource('file') }),
    ).toBe(true)
    expect(canUseAiForActivity({ source: 'file', provenanceDetails: undefined })).toBe(false)
    expect(
      canUseAiForActivity({
        source: 'garmin',
        provenanceDetails: { ...provenanceForSource('garmin'), attribution: null },
      }),
    ).toBe(false)
    expect(canUseAiForActivity({ source: 'strava', provenanceDetails: undefined })).toBe(false)
  })

  it.each([
    ['garmin', 'garmin_ai'],
    ['file', 'file_ai'],
    ['manual', 'manual_ai'],
  ] as const)('allows the AI Coach for %s data', (source, label) => {
    expect(coachModeForSource(source)).toBe('ai')
    expect(canUseAiForSource(source)).toBe(true)
    expect(sourcePolicyLabel(source)).toBe(label)
  })
})
