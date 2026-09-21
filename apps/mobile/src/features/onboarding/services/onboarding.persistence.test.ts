import { describe, expect, it, vi } from 'vitest'

import { onboardingSnapshotSchema } from './onboarding.persistence'

vi.mock('react-native', () => ({ Platform: { OS: 'web' } }))
vi.mock('expo-secure-store', () => ({}))
vi.mock('@/services/supabase/documents', () => ({}))

describe('onboarding completion', () => {
  it('accepts the account step in the saved snapshot', () => {
    expect(
      onboardingSnapshotSchema.parse({
        profile: null,
        goal: null,
        availability: null,
        strava: null,
        currentStep: 8,
        completed: true,
      }).currentStep,
    ).toBe(8)
  })
})
