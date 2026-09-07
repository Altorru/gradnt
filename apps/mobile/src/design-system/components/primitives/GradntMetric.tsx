import { XStack, YStack } from 'tamagui'

import { GradntText } from './GradntText'

type TrendDirection = 'up' | 'down' | 'neutral'

type GradntMetricProps = {
  label: string
  value: string | number
  unit?: string
  trend?: string
  trendDirection?: TrendDirection
}

export function GradntMetric({
  label,
  value,
  unit,
  trend,
  trendDirection = 'neutral',
}: GradntMetricProps) {
  const trendColor =
    trendDirection === 'up' ? '$positive' : trendDirection === 'down' ? '$danger' : '$textSecondary'

  return (
    <YStack gap="$2">
      <GradntText muted fontSize={13}>
        {label}
      </GradntText>

      <XStack alignItems="flex-end" gap="$2">
        <GradntText weight="bold" fontSize={30} lineHeight={34} letterSpacing={-1}>
          {value}
        </GradntText>

        {unit ? (
          <GradntText muted fontSize={14} paddingBottom="$1">
            {unit}
          </GradntText>
        ) : null}
      </XStack>

      {trend ? (
        <GradntText color={trendColor} fontSize={13} weight="semibold">
          {trend}
        </GradntText>
      ) : null}
    </YStack>
  )
}
