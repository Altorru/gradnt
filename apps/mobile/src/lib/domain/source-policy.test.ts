import { describe, expect, it } from 'vitest'

import { canUseAiForSource, coachModeForSource, sourcePolicyLabel } from './source-policy'

describe('source policy', () => {
  it('keeps Strava in deterministic Coach mode', () => {
    expect(coachModeForSource('strava')).toBe('deterministic')
    expect(canUseAiForSource('strava')).toBe(false)
    expect(sourcePolicyLabel('strava')).toBe('strava_deterministic')
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
