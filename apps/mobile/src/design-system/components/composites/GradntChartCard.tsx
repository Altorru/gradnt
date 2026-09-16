import { XStack, YStack } from 'tamagui'

import { GradntMiniBars, GradntSparkline } from '../charts'
import { GradntCard, GradntText } from '../primitives'

type GradntChartCardProps = {
  title: string
  /**
   * What the series counts, shown against the scale reference — "14 h",
   * "4 sorties". A chart of eight unlabelled numbers is a decoration.
   */
  unit: string
  data: number[]
  variant?: 'bars' | 'line'
  description?: string
  height?: number
}

/**
 * A chart with the three things that make it readable.
 *
 * **Its unit**, stated against the scale reference rather than left to the
 * reader. **Its window**, so the span of the x-axis is known. **Its scale**, as
 * the tallest value: without it the bar heights mean nothing, which is what the
 * progress screen's charts were — a shape you could not decode.
 *
 * The reference is drawn in the layout rather than inside the SVG, so it uses
 * the same typography as everything else instead of an SVG text node needing
 * its own font plumbing.
 */
export function GradntChartCard({
  title,
  unit,
  data,
  variant = 'bars',
  description,
  height = 64,
}: GradntChartCardProps) {
  if (data.length === 0) {
    return null
  }

  const max = Math.max(...data)
  const weeks = data.length

  return (
    <GradntCard padding="$4" gap="$3">
      <YStack gap="$1">
        <GradntText weight="semibold">{title}</GradntText>

        {description ? (
          <GradntText muted fontSize={12} lineHeight={17}>
            {description}
          </GradntText>
        ) : null}
      </YStack>

      <YStack gap="$2">
        <XStack alignItems="center" gap="$2">
          <GradntText muted fontSize={11} weight="semibold">
            {Math.round(max * 10) / 10} {unit}
          </GradntText>

          <YStack flex={1} borderTopWidth={1} borderStyle="dashed" borderColor="$border" />
        </XStack>

        {variant === 'bars' ? (
          <GradntMiniBars data={data} height={height} />
        ) : (
          <GradntSparkline data={data} height={height} />
        )}

        <YStack height={1} backgroundColor="$border" />

        <XStack justifyContent="space-between">
          <GradntText muted fontSize={10}>
            il y a {weeks} sem.
          </GradntText>

          <GradntText muted fontSize={10}>
            aujourd’hui
          </GradntText>
        </XStack>
      </YStack>
    </GradntCard>
  )
}
