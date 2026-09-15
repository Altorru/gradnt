import type { ReactNode } from 'react'
import { YStack } from 'tamagui'

import { GradntCard, GradntText } from './primitives'

type GradntStatusCardProps = {
  label: string
  value: string
  detail: string
  visual?: ReactNode
  valueSize?: number
}

/**
 * A compact stat tile.
 *
 * Everything here is informative, so it is all set in neutral ink. The `detail`
 * line used to be accent-coloured on one tile, which meant two things: it was
 * unreadable on a light background, and it put a second, visibly different
 * green next to the accent used on buttons.
 *
 * The visual sits below the text rather than beside it. Side by side, the
 * fixed-width chart left roughly 58dp for the text in a half-width tile, which
 * broke labels mid-word.
 */
export function GradntStatusCard({
  label,
  value,
  detail,
  visual,
  valueSize = 29,
}: GradntStatusCardProps) {
  return (
    <GradntCard premium flex={1} padding="$4" borderRadius={18} gap="$3">
      <YStack flex={1} gap="$1">
        <GradntText muted fontSize={12} lineHeight={15}>
          {label}
        </GradntText>

        <GradntText
          weight="bold"
          fontSize={valueSize}
          lineHeight={valueSize + 3}
          letterSpacing={-0.8}
        >
          {value}
        </GradntText>

        <GradntText muted weight="semibold" fontSize={12} lineHeight={15}>
          {detail}
        </GradntText>
      </YStack>

      {visual ? (
        <YStack width="100%" height={52} justifyContent="flex-end">
          {visual}
        </YStack>
      ) : null}
    </GradntCard>
  )
}
