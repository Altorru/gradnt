import { XStack } from 'tamagui'

import { GradntText } from './GradntText'

type GradntBadgeTone = 'neutral' | 'positive' | 'warning' | 'danger' | 'recovery'

type GradntBadgeProps = {
  children: string
  tone?: GradntBadgeTone
}

export function GradntBadge({ children, tone = 'neutral' }: GradntBadgeProps) {
  const color =
    tone === 'positive'
      ? '$positive'
      : tone === 'warning'
        ? '$warning'
        : tone === 'danger'
          ? '$danger'
          : tone === 'recovery'
            ? '$recovery'
            : '$textSecondary'

  return (
    <XStack
      alignSelf="flex-start"
      paddingHorizontal="$3"
      paddingVertical="$2"
      borderRadius="$pill"
      backgroundColor="$backgroundSubtle"
    >
      <GradntText color={color} weight="semibold" fontSize={12} lineHeight={14}>
        {children}
      </GradntText>
    </XStack>
  )
}
