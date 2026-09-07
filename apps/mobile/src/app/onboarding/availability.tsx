import { YStack } from 'tamagui'

import { GradntHeading, GradntMobileShell, GradntText } from '@/design-system'

export default function AvailabilityPlaceholder() {
  return (
    <GradntMobileShell>
      <YStack flex={1} padding="$5" gap="$3">
        <GradntHeading>Tes disponibilités</GradntHeading>

        <GradntText muted>Étape 4 de l&apos;onboarding.</GradntText>
      </YStack>
    </GradntMobileShell>
  )
}
