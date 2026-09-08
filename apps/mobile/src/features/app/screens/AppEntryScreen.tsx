import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator } from 'react-native'
import { YStack } from 'tamagui'

import { GradntMobileShell } from '@/design-system'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'

export default function AppEntryScreen() {
  const router = useRouter()
  const hydrated = useOnboardingStore((state) => state.hydrated)
  const completed = useOnboardingStore((state) => state.completed)

  useEffect(() => {
    if (!hydrated) {
      return
    }

    router.replace(completed ? './home' : '/onboarding')
  }, [completed, hydrated, router])

  return (
    <GradntMobileShell>
      <YStack flex={1} alignItems="center" justifyContent="center">
        <ActivityIndicator />
      </YStack>
    </GradntMobileShell>
  )
}
