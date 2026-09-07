import type { ComponentProps } from 'react'
import { YStack } from 'tamagui'

type GradntSurfaceProps = ComponentProps<typeof YStack> & {
  tone?: 'default' | 'subtle' | 'accent'
}

export function GradntSurface({ tone = 'default', ...props }: GradntSurfaceProps) {
  const backgroundColor =
    tone === 'accent' ? '$accent' : tone === 'subtle' ? '$backgroundSubtle' : '$backgroundElevated'

  const borderColor = tone === 'accent' ? '$accent' : '$border'

  return (
    <YStack
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      borderWidth={1}
      borderRadius="$5"
      {...props}
    />
  )
}
