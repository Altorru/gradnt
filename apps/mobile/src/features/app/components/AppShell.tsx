import type { PropsWithChildren, ReactNode } from 'react'
import { XStack, YStack } from 'tamagui'

import { GradntBottomNav, GradntScreen, SCREEN_GUTTER } from '@/design-system'

/**
 * Frame for the tabbed app screens.
 *
 * Only the top edge is inset here: `GradntBottomNav` applies the bottom inset
 * itself, so asking the frame for it too would count it twice.
 *
 * Horizontal padding is left to the content (`AppHeader`, `AppScrollView`)
 * rather than the frame, so the two can never drift apart by a few pixels.
 */
export function AppShell({ children, header }: PropsWithChildren<{ header?: ReactNode }>) {
  return (
    <GradntScreen edges={['top']} padded={false}>
      <YStack flex={1}>
        {header}
        <YStack flex={1}>{children}</YStack>
        <GradntBottomNav />
      </YStack>
    </GradntScreen>
  )
}

export function AppHeader({ children }: PropsWithChildren) {
  return (
    <XStack
      paddingHorizontal={SCREEN_GUTTER}
      paddingTop="$4"
      paddingBottom="$2"
      alignItems="center"
    >
      {children}
    </XStack>
  )
}

/**
 * Kept as an alias so the tabbed screens keep their existing import, while the
 * gutter lives in exactly one place.
 */
export { GradntScrollView as AppScrollView } from '@/design-system'
