import type { ComponentProps } from 'react'
import { Text } from 'tamagui'

type GradntTextProps = ComponentProps<typeof Text> & {
  muted?: boolean
  weight?: 'regular' | 'medium' | 'semibold' | 'bold'
}

const weights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export function GradntText({
  muted = false,
  weight = 'regular',
  color,
  ...props
}: GradntTextProps) {
  return (
    <Text
      fontFamily="$body"
      fontWeight={weights[weight]}
      color={color ?? (muted ? '$textSecondary' : '$color')}
      fontSize={16}
      lineHeight={23}
      {...props}
    />
  )
}
