import { describe, expect, it } from 'vitest'

import { defaultWeeklyAvailability } from './availability.schema'
import { nextRequiredOnboardingStep } from './onboarding-progress'

describe('signed-in onboarding recovery', () => {
  const profile = { discipline: 'road', experience: 'beginner', weeklyVolume: 'lt3' } as const
  const goal = { type: 'distance', targetValue: '100', eventName: '' } as const
  const availability = defaultWeeklyAvailability

  it('finishes a complete draft instead of returning to account creation', () => {
    expect(nextRequiredOnboardingStep({ profile, goal, availability })).toBeNull()
  })

  it('resumes at the first missing answer', () => {
    expect(nextRequiredOnboardingStep(null)).toBe('/onboarding/profile')
    expect(nextRequiredOnboardingStep({ profile, goal: null, availability })).toBe(
      '/onboarding/goal',
    )
    expect(nextRequiredOnboardingStep({ profile, goal, availability: null })).toBe(
      '/onboarding/availability',
    )
  })
})
