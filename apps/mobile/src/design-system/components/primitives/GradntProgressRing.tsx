import { Circle, Svg } from 'react-native-svg'
import { YStack } from 'tamagui'

import { colors } from '../../tokens'
import { GradntText } from './GradntText'

type GradntProgressRingProps = {
  value: number
  size?: number
  strokeWidth?: number
}

export function GradntProgressRing({ value, size = 88, strokeWidth = 8 }: GradntProgressRingProps) {
  const normalized = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalized / 100) * circumference

  return (
    <YStack width={size} height={size} alignItems="center" justifyContent="center">
      <Svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.graphite700}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.lime}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>

      <GradntText weight="bold" fontSize={28} lineHeight={30}>
        {normalized}
      </GradntText>
    </YStack>
  )
}
