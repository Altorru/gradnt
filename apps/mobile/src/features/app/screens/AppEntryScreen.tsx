import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { YStack } from 'tamagui'

import { GradntScreen } from '@/design-system'
import {
  getOnboardingResumeRoute,
  useOnboardingStore,
} from '@/features/onboarding/store/onboarding.store'

/**
 * Where a launch lands.
 *
 * The resume decision lives here rather than on the welcome screen, which stays
 * mounted underneath every step of the flow. A redirect there re-fired each time
 * a step saved its answer — `setProfile`, `setGoal` and the rest all bump
 * `currentStep` — so every save navigated from the background, racing the screen
 * in front of it and stacking a second copy of the step the rider had just left.
 *
 * This screen is replaced the moment it has decided, so it cannot do that.
 */
// No return annotation: expo-router types its routes as a union of literals,
// and widening to `string` here would have to be narrowed back at the call.
function launchDestination(completed: boolean, currentStep: number) {
  if (completed) {
    return '/home'
  }

  // Straight to the step they stopped on, with no welcome screen underneath to
  // be pushed over later.
  return currentStep > 1 ? getOnboardingResumeRoute(currentStep) : '/onboarding'
}

export default function AppEntryScreen() {
  const router = useRouter()
  const hydrated = useOnboardingStore((state) => state.hydrated)
  const completed = useOnboardingStore((state) => state.completed)
  const currentStep = useOnboardingStore((state) => state.currentStep)

  useEffect(() => {
    if (!hydrated) {
      return
    }

    router.replace(launchDestination(completed, currentStep))
  }, [completed, currentStep, hydrated, router])

  return (
    <GradntScreen>
      <YStack flex={1} alignItems="center" justifyContent="center">
        <ActivityIndicator />
      </YStack>
    </GradntScreen>
  )
}
