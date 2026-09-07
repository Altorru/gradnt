import type { PropsWithChildren } from 'react'

import { YStack } from 'tamagui'

import { MOBILE_CANVAS_WIDTH } from '../../constants/layout'

export function GradntMobileCanvas({ children }: PropsWithChildren) {
  return (
    <YStack
      width="100%"
      maxWidth={MOBILE_CANVAS_WIDTH}
      alignSelf="center"
      paddingHorizontal="$4"
      paddingVertical="$4"
    >
      {children}
    </YStack>
  )
}
