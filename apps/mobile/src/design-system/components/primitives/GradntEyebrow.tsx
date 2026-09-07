import type { ComponentProps } from 'react'

import { GradntText } from './GradntText'

type GradntEyebrowProps = ComponentProps<typeof GradntText>

export function GradntEyebrow(props: GradntEyebrowProps) {
  return (
    <GradntText
      muted
      weight="semibold"
      fontSize={11}
      lineHeight={14}
      letterSpacing={1.1}
      {...props}
    />
  )
}
