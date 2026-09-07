import type { ComponentProps } from 'react'
import { Text } from 'tamagui'

type GradntHeadingProps = ComponentProps<typeof Text> & {
  level?: 1 | 2 | 3
}

const levels = {
  1: {
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
  },
  2: {
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.5,
  },
  3: {
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
} as const

export function GradntHeading({ level = 1, ...props }: GradntHeadingProps) {
  return (
    <Text
      fontFamily="$heading"
      fontWeight="700"
      color="$textPrimary"
      {...levels[level]}
      {...props}
    />
  )
}
