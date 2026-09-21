import { Share } from 'react-native'
import { YStack } from 'tamagui'

import { GradntButton } from './primitives/GradntButton'
import { GradntCard } from './primitives/GradntCard'
import { GradntText } from './primitives/GradntText'

type GradntShareCardProps = {
  eyebrow: string
  title: string
  body: string
  shareLabel: string
  shareMessage: string
}

/** A lightweight shareable card that never includes raw ride data or private notes. */
export function GradntShareCard({
  eyebrow,
  title,
  body,
  shareLabel,
  shareMessage,
}: GradntShareCardProps) {
  return (
    <GradntCard premium gap="$3">
      <GradntText muted fontSize={11} weight="semibold" letterSpacing={1}>
        {eyebrow}
      </GradntText>
      <YStack gap="$1">
        <GradntText weight="bold" fontSize={20}>
          {title}
        </GradntText>
        <GradntText lineHeight={20}>{body}</GradntText>
      </YStack>
      <GradntButton
        tone="secondary"
        onPress={() => {
          void Share.share({ message: shareMessage })
        }}
      >
        {shareLabel}
      </GradntButton>
    </GradntCard>
  )
}
