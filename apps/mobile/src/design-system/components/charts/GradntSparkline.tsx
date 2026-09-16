import { area, curveMonotoneX, line } from 'd3-shape'
import { useId, useState } from 'react'
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg'

import { useThemeColor } from '../../hooks/useThemeColor'
import { GradntText } from '../primitives'

type Point = {
  x: number
  y: number
}

type GradntSparklineProps = {
  data: number[]
  height?: number
  /** Unit of the values, for the touch targets' labels. */
  unit?: string
  /** The value at the top of the plot, printed to the left of the scale line. */
  scaleLabel?: string
  selectedIndex?: number | null
  onSelectIndex?: (index: number) => void
}

const PADDING_X = 5
const PLOT_BOTTOM = 5

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
 * A trend line that fills the width it is given.
 *
 * It measures its own container rather than taking a width, so it fills whatever
 * block it is placed in.
 *
 * The scale line sits at the ordinate the highest value is plotted at, inside
 * the SVG, and the chart prints its own label beside it — split across two
 * components, the label and the line drifted apart and the number pointed at
 * nothing.
 */
export function GradntSparkline({
  data,
  height = 52,
  unit,
  scaleLabel,
  selectedIndex = null,
  onSelectIndex,
}: GradntSparklineProps) {
  const gradientId = `gradntSpark${useId().replace(/:/g, '')}`
  const themeColor = useThemeColor()
  const accent = themeColor('accentInk')
  const [width, setWidth] = useState(0)

  if (data.length < 2) {
    return null
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points: Point[] = data.map((value, index) => ({
    x: PADDING_X + (index / (data.length - 1)) * (width - PADDING_X * 2),

    y: height - PLOT_BOTTOM - ((value - min) / range) * (height - PLOT_TOP - PLOT_BOTTOM),
  }))

  const linePath =
    width > 0
      ? (line<Point>()
          .x((point) => point.x)
          .y((point) => point.y)
          .curve(curveMonotoneX)(points) ?? '')
      : ''

  const areaPath =
    width > 0
      ? (area<Point>()
          .x((point) => point.x)
          .y0(height - PLOT_BOTTOM)
          .y1((point) => point.y)
          .curve(curveMonotoneX)(points) ?? '')
      : ''

  const selectedPoint = selectedIndex === null ? undefined : points[selectedIndex]

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
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={accent} stopOpacity={0.22} />

                  <Stop offset="1" stopColor={accent} stopOpacity={0} />
                </LinearGradient>
              </Defs>

              {/* The highest value is plotted at PLOT_TOP, so that is where the
                scale line belongs. */}
              <Line
                x1={0}
                y1={PLOT_TOP}
                x2={width}
                y2={PLOT_TOP}
                stroke={themeColor('border')}
                strokeWidth={1}
                strokeDasharray="3 3"
              />

              <Path d={areaPath} fill={`url(#${gradientId})`} />

              <Path
                d={linePath}
                fill="none"
                stroke={accent}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.07}
              />

              <Path
                d={linePath}
                fill="none"
                stroke={accent}
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {selectedPoint ? (
                <Circle cx={selectedPoint.x} cy={selectedPoint.y} r={4} fill={accent} />
              ) : null}
            </Svg>

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
