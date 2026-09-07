import { useRouter } from 'expo-router'
import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { YStack } from 'tamagui'

import { GradntHeading, GradntIconButton, GradntMobileShell, GradntText } from '@/design-system'

export default function OnboardingProfilePlaceholder() {
  const router = useRouter()

  return (
    <GradntMobileShell>
      <YStack flex={1} padding="$5" gap="$7">
        <GradntIconButton onPress={() => router.back()}>
          <ArrowLeft size={18} />
        </GradntIconButton>

        <YStack gap="$2">
          <GradntHeading>Ton profil cycliste</GradntHeading>

          <GradntText muted>Prochaine étape de l&apos;onboarding.</GradntText>
        </YStack>
      </YStack>
    </GradntMobileShell>
  )
}
