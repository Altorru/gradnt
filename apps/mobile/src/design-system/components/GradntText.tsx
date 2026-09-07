import type { ComponentProps } from 'react'
import { Text } from 'tamagui'

type GradntTextProps = ComponentProps<typeof Text> & {
  muted?: boolean
}

export function GradntText({ muted = false, ...props }: GradntTextProps) {
  return (
    <Text
      color={muted ? '$textSecondary' : '$textPrimary'}
      fontSize={16}
      lineHeight={23}
      {...props}
    />
  )
}
