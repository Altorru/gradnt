import type { ReactNode } from 'react'
import { YStack } from 'tamagui'

import { GradntText } from './primitives'

type GradntStatusCardProps = {
  label: string
  value: string
  detail: string
  accent?: boolean
  visual?: ReactNode
}

export function GradntStatusCard({
  label,
  value,
  detail,
  accent = false,
  visual,
}: GradntStatusCardProps) {
  return (
    <YStack
      flex={1}
      minHeight={128}
      borderRadius="$4"
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$backgroundElevated"
      padding="$4"
      justifyContent="space-between"
    >
      <GradntText muted fontSize={13}>
        {label}
      </GradntText>

      <YStack gap="$1">
        <GradntText weight="bold" fontSize={30} lineHeight={32}>
          {value}
        </GradntText>

        <GradntText color={accent ? '$accent' : '$textSecondary'} weight="semibold" fontSize={13}>
          {detail}
        </GradntText>
      </YStack>

      {visual}
    </YStack>
  )
}
