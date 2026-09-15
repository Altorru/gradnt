import type { PropsWithChildren, ReactNode } from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'

import { GradntScreen, GradntScrollView, SCREEN_GUTTER } from '@/design-system'

/**
 * Frame for the tabbed app screens.
 *
 * Only the top edge is inset. The bottom is deliberately left alone so the
 * screen content runs all the way under the tab bar: on iOS 26 the bar is a
 * floating sheet of Liquid Glass, and it can only refract what passes beneath
 * it. Insetting the frame instead stops the content above the bar, and the
 * glass ends up showing nothing but the flat background — a solid slab rather
 * than glass.
 *
 * The clearance the last element needs is therefore added to the scroll's
 * *content* padding (see `AppScrollView`), not to the layout.
 *
 * The tab bar itself used to be rendered in this file. It now belongs to the
 * `(tabs)` layout, which is what makes the destinations real tabs instead of
 * screens pushed onto a stack.
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
 * Scroll container for the tabbed screens.
 *
 * Clears the floating tab bar by padding the content rather than insetting the
 * layout, so content still scrolls under the bar and the glass has something to
 * refract. Expo Router's automatic content inset adjustment does not reach
 * here, because it only applies to the *first* `ScrollView` in a tab screen and
 * these screens render a fixed header ahead of it.
 *
 * iOS only: on Android Expo Router already wraps each tab's content in a
 * bottom-inset `SafeAreaView`, so doing it here as well would double it.
 */
export function AppScrollView({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets()

  return (
    <GradntScrollView
      contentStyle={{
        paddingBottom: Platform.OS === 'ios' ? SCREEN_GUTTER + insets.bottom : SCREEN_GUTTER,
      }}
    >
      {children}
    </GradntScrollView>
  )
}
