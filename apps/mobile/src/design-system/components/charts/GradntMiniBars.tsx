import { useState } from 'react'
import { type LayoutChangeEvent, View } from 'react-native'
import Svg, { Rect } from 'react-native-svg'

import { useThemeColor } from '../../hooks/useThemeColor'

type GradntMiniBarsProps = {
  data: number[]
  activeIndices?: number[]
  height?: number
  /** Space between bars. Defaults to a share of the available width. */
  gap?: number
}

/**
 * A row of bars that fills the width it is given.
 *
 * It measures its own container rather than taking a width, so it fills whatever
 * block it is placed in. It used to cap the bars at 9px and right-align the
 * group, which left most of the block empty however wide the caller asked for —
 * the width was never the problem.
 */
export function GradntMiniBars({ data, activeIndices, height = 52, gap }: GradntMiniBarsProps) {
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

  return (
    <View
      style={{ width: '100%', height }}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {data.map((value, index) => {
            // A week with no riding draws nothing, which is what a gap should
            // look like. The old floor of 5px gave an empty week the same stub
            // as a light one, so the two were indistinguishable.
            const barHeight = value > 0 ? Math.max(3, (value / scale) * (height - 2)) : 0

            const active = activeIndices?.includes(index) ?? true

            return (
              <Rect
                key={`${value}-${index}`}
                x={index * (barWidth + resolvedGap)}
                y={height - barHeight}
                width={barWidth}
                height={barHeight}
                rx={radius}
                fill={active ? themeColor('accentInk') : themeColor('border')}
                opacity={active ? 1 : 0.48}
              />
            )
          })}
        </Svg>
      ) : null}
    </View>
  )
}
