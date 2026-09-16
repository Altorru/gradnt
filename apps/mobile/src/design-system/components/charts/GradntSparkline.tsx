import { area, curveMonotoneX, line } from 'd3-shape'
import { useId, useState } from 'react'
import { type LayoutChangeEvent, View } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import { useThemeColor } from '../../hooks/useThemeColor'

type Point = {
  x: number
  y: number
}

type GradntSparklineProps = {
  data: number[]
  height?: number
}

/**
 * A trend line that fills the width it is given.
 *
 * It measures its own container rather than taking a width, so it fills whatever
 * block it is placed in.
 */
export function GradntSparkline({ data, height = 52 }: GradntSparklineProps) {
  const gradientId = `gradntSpark${useId().replace(/:/g, '')}`
  const themeColor = useThemeColor()
  const accent = themeColor('accentInk')
  const [width, setWidth] = useState(0)

  if (data.length < 2) {
    return null
  }

  const padding = 5
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points: Point[] = data.map((value, index) => ({
    x: padding + (index / (data.length - 1)) * (width - padding * 2),

    y: height - padding - ((value - min) / range) * (height - padding * 2),
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
          .y0(height - padding)
          .y1((point) => point.y)
          .curve(curveMonotoneX)(points) ?? '')
      : ''

  return (
    <View
      style={{ width: '100%', height }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={accent} stopOpacity={0.22} />

              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </LinearGradient>
          </Defs>

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
        </Svg>
      ) : null}
    </View>
  )
}
