import { YStack } from 'tamagui'

import { GradntHeading, GradntText } from '@/design-system'

export default function ThemeDebugScreen() {
  return (
    <YStack flex={1} backgroundColor="$background" padding="$6" gap="$4">
      <GradntHeading>DARK THEME</GradntHeading>

      <GradntText>Ce texte doit être Bone.</GradntText>

      <GradntText muted>Ce texte doit être gris.</GradntText>

      <YStack
        height={80}
        backgroundColor="$backgroundElevated"
        borderColor="$border"
        borderWidth={1}
        borderRadius="$4"
      />

      <YStack height={80} backgroundColor="$accent" borderRadius="$4" />
    </YStack>
  )
}
