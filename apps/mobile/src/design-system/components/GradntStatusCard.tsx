import type { ReactNode } from 'react'
import { XStack, YStack } from 'tamagui'

import { GradntCard, GradntText } from './primitives'

type GradntStatusCardProps = {
  label: string
  value: string
  detail: string
  accent?: boolean
  visual?: ReactNode
  valueSize?: number
}

export function GradntStatusCard({
  label,
  value,
  detail,
  accent = false,
  visual,
  valueSize = 29,
}: GradntStatusCardProps) {
  return (
    <GradntCard premium flex={1} minHeight={126} padding="$4" borderRadius={18}>
      <XStack flex={1} alignItems="flex-end" justifyContent="space-between" gap="$3">
        <YStack flex={1} alignSelf="stretch" justifyContent="space-between">
          <GradntText muted fontSize={12} lineHeight={15}>
            {label}
          </GradntText>

          <YStack gap="$1">
            <GradntText
              weight="bold"
              fontSize={valueSize}
              lineHeight={valueSize + 3}
              letterSpacing={-0.8}
            >
              {value}
            </GradntText>

            <GradntText
              color={accent ? '$accent' : '$textSecondary'}
              weight="semibold"
              fontSize={12}
              lineHeight={15}
            >
              {detail}
            </GradntText>
          </YStack>
        </YStack>

        {visual ? (
          <YStack width={96} height={58} justifyContent="flex-end" alignItems="flex-end">
            {visual}
          </YStack>
        ) : null}
      </XStack>
    </GradntCard>
  )
}
