import type { OnboardingSnapshot } from '../services/onboarding.persistence'

/** A signed-in rider resumes at the first answer still needed for a usable plan. */
export function nextRequiredOnboardingStep(
  snapshot: Pick<OnboardingSnapshot, 'profile' | 'goal' | 'availability'> | null,
): '/onboarding/profile' | '/onboarding/goal' | '/onboarding/availability' | null {
  if (!snapshot?.profile) return '/onboarding/profile'
  if (!snapshot.goal) return '/onboarding/goal'
  if (!snapshot.availability) return '/onboarding/availability'
  return null
}
