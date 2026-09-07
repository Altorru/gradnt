import { YStack } from 'tamagui'

import { GradntHeading, GradntMobileShell, GradntText } from '@/design-system'

export default function GoalPlaceholder() {
  return (
    <GradntMobileShell>
      <YStack flex={1} padding="$5" gap="$3">
        <GradntHeading>Ton objectif</GradntHeading>

        <GradntText muted>Étape suivante.</GradntText>
      </YStack>
    </GradntMobileShell>
  )
}
