import { area, curveMonotoneX, line } from 'd3-shape'
import { useId } from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

import { colors } from '../../tokens'

type Point = {
  x: number
  y: number
}

type GradntSparklineProps = {
  data: number[]
  width?: number
  height?: number
}

export function GradntSparkline({ data, width = 96, height = 52 }: GradntSparklineProps) {
  const gradientId = `gradntSpark${useId().replace(/:/g, '')}`

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
    line<Point>()
      .x((point) => point.x)
      .y((point) => point.y)
      .curve(curveMonotoneX)(points) ?? ''

  const areaPath =
    area<Point>()
      .x((point) => point.x)
      .y0(height - padding)
      .y1((point) => point.y)
      .curve(curveMonotoneX)(points) ?? ''

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.lime} stopOpacity={0.22} />

          <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
        </LinearGradient>
      </Defs>

      <Path d={areaPath} fill={`url(#${gradientId})`} />

      <Path
        d={linePath}
        fill="none"
        stroke={colors.lime}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.07}
      />

      <Path
        d={linePath}
        fill="none"
        stroke={colors.lime}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
