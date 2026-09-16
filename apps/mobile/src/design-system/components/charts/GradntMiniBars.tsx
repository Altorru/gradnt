import { useState } from 'react'
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Line, Rect } from 'react-native-svg'

import { useThemeColor } from '../../hooks/useThemeColor'
import { GradntText } from '../primitives'

type GradntMiniBarsProps = {
  data: number[]
  activeIndices?: number[]
  height?: number
  /** Space between bars. Defaults to a share of the available width. */
  gap?: number
  /** Unit of the values, for the touch targets' labels. */
  unit?: string
  /**
   * The value at the top of the plot, printed to the left of the scale line.
   *
   * The chart renders it rather than the card, because only the chart knows at
   * which ordinate its line sits — split across two components, the label and
   * the line drifted apart and the number ended up pointing at nothing.
   */
  scaleLabel?: string
  selectedIndex?: number | null
  onSelectIndex?: (index: number) => void
}

/**
 * Space above the plot for the scale label.
 *
 * The label is centred on the scale line, so the line needs half the label's
 * height of room above it — with the line at the very top, the label would spill
 * out of the block instead of sitting level with it.
 */
const SCALE_LABEL_HEIGHT = 12
const PLOT_TOP = SCALE_LABEL_HEIGHT / 2 + 1
const SCALE_LABEL_OFFSET = PLOT_TOP - SCALE_LABEL_HEIGHT / 2

/**
 * A row of bars that fills the width it is given.
 *
 * It measures its own container rather than taking a width, so it fills whatever
 * block it is placed in. It used to cap the bars at 9px and right-align the
 * group, which left most of the block empty however wide the caller asked for —
 * the width was never the problem.
 *
 * The tallest bar reaches the top of the plot, and the scale line is drawn at
 * that same ordinate inside the SVG.
 */
export function GradntMiniBars({
  data,
  activeIndices,
  height = 52,
  gap,
  unit,
  scaleLabel,
  selectedIndex = null,
  onSelectIndex,
}: GradntMiniBarsProps) {
  const themeColor = useThemeColor()
  const [width, setWidth] = useState(0)

  if (data.length === 0) {
    return null
  }

  const resolvedGap = gap ?? Math.max(4, width * 0.02)
  const barWidth = Math.max(2, (width - resolvedGap * (data.length - 1)) / data.length)
  const max = Math.max(...data)
  const scale = max > 0 ? max : 1
  const radius = Math.min(barWidth / 2, 6)
  const plotHeight = height - PLOT_TOP

  return (
    <View style={{ width: '100%', height, flexDirection: 'row', gap: 6 }}>
      {scaleLabel ? (
        <GradntText
          muted
          fontSize={10}
          lineHeight={SCALE_LABEL_HEIGHT}
          marginTop={SCALE_LABEL_OFFSET}
        >
          {scaleLabel}
        </GradntText>
      ) : null}

      <View
        style={{ flex: 1 }}
        onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      >
        {width > 0 ? (
          <>
            <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
              {/* Drawn in the same space as the bars, so it marks the top of the
                  plot exactly rather than approximately. */}
              <Line
                x1={0}
                y1={PLOT_TOP}
                x2={width}
                y2={PLOT_TOP}
                stroke={themeColor('border')}
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              {data.map((value, index) => {
                // A week with no riding draws nothing, which is what a gap
                // should look like. The old floor of 5px gave an empty week the
                // same stub as a light one, so the two were indistinguishable.
                const barHeight = value > 0 ? Math.max(3, (value / scale) * plotHeight) : 0

                // Once something is selected, only it stays lit — the point of
                // tapping is to read one moment, not to compare all of them.
                const dimmed =
                  selectedIndex !== null
                    ? index !== selectedIndex
                    : !(activeIndices?.includes(index) ?? true)

                return (
                  <Rect
                    key={`${value}-${index}`}
                    x={index * (barWidth + resolvedGap)}
                    y={height - barHeight}
                    width={barWidth}
                    height={barHeight}
                    rx={radius}
                    fill={dimmed ? themeColor('border') : themeColor('accentInk')}
                    opacity={dimmed ? 0.48 : 1}
                  />
                )
              })}
            </Svg>

            {/* One target per column, laid over the drawing. Dividing the row
                evenly is close enough to the bar pitch for a finger, and it
                keeps the geometry out of the touch handling. */}
            {onSelectIndex ? (
              <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
                {data.map((value, index) => (
                  <Pressable
                    key={index}
                    style={{ flex: 1 }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedIndex === index }}
                    accessibilityLabel={`${value} ${unit ?? ''}`.trim()}
                    onPress={() => onSelectIndex(index)}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  )
}
