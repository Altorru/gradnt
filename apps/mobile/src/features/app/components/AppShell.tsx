import type { PropsWithChildren, ReactNode } from 'react'
import { XStack, YStack } from 'tamagui'

import { GradntScreen, SCREEN_GUTTER } from '@/design-system'

/**
 * Frame for the tabbed app screens.
 *
 * Only the top edge is inset: the tab bar is a layer of the navigator and owns
 * the bottom of the screen, so adding a bottom inset here would push content
 * away from it for no reason.
 *
 * The tab bar itself used to be rendered here. It now belongs to the `(tabs)`
 * layout, which is what makes the destinations real tabs instead of screens
 * pushed onto a stack.
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
