import { YStack } from 'tamagui'
import { GradntCard, GradntEyebrow, GradntText } from '../primitives'

type GradntStatCardProps = {
  label: string
  value: string
  unit?: string
  subtitle?: string
  trend?: string
  trendTone?: 'positive' | 'danger' | 'neutral'
}

export function GradntStatCard({
  label,
  value,
  unit,
  subtitle,
  trend,
  trendTone = 'neutral',
}: GradntStatCardProps) {
  const trendColor =
    trendTone === 'positive' ? '$positive' : trendTone === 'danger' ? '$danger' : '$textSecondary'

  return (
    <GradntCard flex={1} gap="$3" minHeight={170}>
      <GradntEyebrow>{label}</GradntEyebrow>

      <YStack gap="$1">
        <GradntText fontSize={42} lineHeight={44} weight="bold">
          {value}
          {unit ? (
            <GradntText fontSize={18} lineHeight={20} weight="medium" muted>
              {' '}
              {unit}
            </GradntText>
          ) : null}
        </GradntText>

        {subtitle ? <GradntText muted>{subtitle}</GradntText> : null}
      </YStack>

      {trend ? (
        <GradntText color={trendColor} weight="semibold" fontSize={14}>
          {trend}
        </GradntText>
      ) : null}
    </GradntCard>
  )
}
