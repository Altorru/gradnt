import Svg, { Rect } from 'react-native-svg'

import { colors } from '../../tokens'

type GradntMiniBarsProps = {
  data: number[]
  activeIndices?: number[]
  width?: number
  height?: number
  gap?: number
}

export function GradntMiniBars({
  data,
  activeIndices,
  width = 82,
  height = 52,
  gap = 5,
}: GradntMiniBarsProps) {
  if (!data.length) {
    return null
  }

  const max = Math.max(...data) || 1

  const calculatedWidth = (width - gap * (data.length - 1)) / data.length

  const barWidth = Math.min(9, calculatedWidth)

  const contentWidth = barWidth * data.length + gap * (data.length - 1)

  const offsetX = width - contentWidth

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((value, index) => {
        const barHeight = Math.max(5, (value / max) * (height - 2))

        const active = activeIndices?.includes(index) ?? true

        return (
          <Rect
            key={`${value}-${index}`}
            x={offsetX + index * (barWidth + gap)}
            y={height - barHeight}
            width={barWidth}
            height={barHeight}
            rx={barWidth / 2}
            fill={active ? colors.lime : colors.graphite700}
            opacity={active ? 1 : 0.48}
          />
        )
      })}
    </Svg>
  )
}
