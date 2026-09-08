import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { useOnboardingStore } from '../store/onboarding.store'

export function OnboardingHydration({ children }: PropsWithChildren) {
  const hydrate = useOnboardingStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return children
}
