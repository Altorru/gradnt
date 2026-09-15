import type { PropsWithChildren } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

import { CONTENT_MAX_WIDTH, SCREEN_GUTTER } from '../../constants/layout'

export type ScreenEdge = 'top' | 'bottom' | 'left' | 'right'

const ALL_EDGES: readonly ScreenEdge[] = ['top', 'bottom', 'left', 'right']

type GradntScreenProps = PropsWithChildren<{
  /** Apply the standard content gutter. Turn off for full-bleed content such as maps. */
  padded?: boolean
  /**
   * Safe-area edges to inset.
   *
   * Omit `bottom` where a bottom bar already applies that inset itself
   * (`GradntBottomNav` does), otherwise it is counted twice.
   */
  edges?: readonly ScreenEdge[]
}>

/**
 * The single screen frame: fills the viewport, paints the background, insets
 * content from the system bars, and keeps the content column readable on wide
 * screens.
 *
 * Built on `useSafeAreaInsets` rather than `SafeAreaView` because the
 * background must extend *under* the system bars while only the content is
 * inset. `SafeAreaView` takes a React Native style object, where Tamagui tokens
 * do not resolve, which would mean resolving `$background` by hand.
 */
export function GradntScreen({ children, padded = true, edges = ALL_EDGES }: GradntScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={edges.includes('top') ? insets.top : 0}
      paddingBottom={edges.includes('bottom') ? insets.bottom : 0}
      paddingLeft={edges.includes('left') ? insets.left : 0}
      paddingRight={edges.includes('right') ? insets.right : 0}
    >
      <YStack
        flex={1}
        width="100%"
        maxWidth={CONTENT_MAX_WIDTH}
        alignSelf="center"
        paddingHorizontal={padded ? SCREEN_GUTTER : 0}
      >
        {children}
      </YStack>
    </YStack>
  )
}
