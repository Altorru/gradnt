import { useState } from 'react'
import { XStack, YStack } from 'tamagui'

import { GradntMiniBars, GradntSparkline } from '../charts'
import { GradntCard, GradntText } from '../primitives'

type GradntChartCardProps = {
  title: string
  /**
   * What the series counts — "h", "sorties". Stated against the top of the plot
   * so the tallest bar can be read rather than guessed at.
   */
  unit: string
  data: number[]
  variant?: 'bars' | 'line'
  description?: string
  height?: number
  /**
   * What the rider gets from tapping a point. A second series shown beside the
   * first, because a week's hours mean more next to how many rides produced
   * them.
   */
  secondary?: { data: number[]; unit: string }
  /** Names the window a point covers, e.g. "du 12 au 18 août". */
  windowLabel?: (index: number) => string
}

/**
 * A chart that says what it measures and answers when touched.
 *
 * **Its scale** is the tallest value, stated in the header where statistics
 * belong, and marked by a line drawn at that value's ordinate *inside* the
 * plot. It used to be a label and a rule in the layout above the chart, in a
 * different coordinate space, so it pointed at nothing and the bars never
 * reached it.
 *
 * **Its window** sits under the baseline. **Its points** are tappable: selecting
 * one dims the rest and swaps the caption for that moment's figures, which is
 * the only way to read a value off a chart this small.
 */
export function GradntChartCard({
  title,
  unit,
  data,
  variant = 'bars',
  description,
  height = 64,
  secondary,
  windowLabel,
}: GradntChartCardProps) {
  const [selected, setSelected] = useState<number | null>(null)

  if (data.length === 0) {
    return null
  }

  const max = Math.max(...data)
  const weeks = data.length

  const select = (index: number) => {
    setSelected((current) => (current === index ? null : index))
  }

  const detail =
    selected === null
      ? null
      : [
          `${data[selected]} ${unit}`,
          secondary ? `${secondary.data[selected]} ${secondary.unit}` : null,
        ]
          .filter(Boolean)
          .join(' · ')

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
        {variant === 'bars' ? (
          <GradntMiniBars
            data={data}
            height={height}
            unit={unit}
            scaleLabel={`${Math.round(max * 10) / 10} ${unit}`}
            selectedIndex={selected}
            onSelectIndex={select}
          />
        ) : (
          <GradntSparkline
            data={data}
            height={height}
            unit={unit}
            scaleLabel={`${Math.round(max * 10) / 10} ${unit}`}
            selectedIndex={selected}
            onSelectIndex={select}
          />
        )}

        <YStack height={1} backgroundColor="$border" />

        <XStack justifyContent="space-between" gap="$3">
          <GradntText muted fontSize={10} numberOfLines={1}>
            {selected === null
              ? `il y a ${weeks} sem.`
              : (windowLabel?.(selected) ?? `Point ${selected + 1}`)}
          </GradntText>

          {selected === null ? (
            <GradntText muted fontSize={10}>
              aujourd’hui
            </GradntText>
          ) : (
            <GradntText color="$accentInk" weight="semibold" fontSize={10}>
              {detail}
            </GradntText>
          )}
        </XStack>

        {selected !== null ? (
          <GradntText muted fontSize={10}>
            Touche à nouveau pour fermer.
          </GradntText>
        ) : null}
      </YStack>
    </GradntCard>
  )
}
