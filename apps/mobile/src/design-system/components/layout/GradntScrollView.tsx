import { ScrollView, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native'

import { SCREEN_GUTTER } from '../../constants/layout'

type GradntScrollViewProps = Omit<ScrollViewProps, 'style' | 'contentContainerStyle'> & {
  /** Apply the standard content gutter. Turn off for full-bleed content. */
  padded?: boolean
  /** Extra content styling, merged after the defaults so it can override them. */
  contentStyle?: StyleProp<ViewStyle>
}

/**
 * The standard scroll container, so the gutter is defined once instead of being
 * repeated as a literal in every screen.
 *
 * Vertical padding replaces the per-screen `paddingTop`/`paddingBottom`
 * literals; the system bars themselves are already handled by `GradntScreen`.
 *
 * Any other `ScrollView` prop is forwarded, so screen-specific behaviour such
 * as `fadingEdgeLength` is not lost.
 */
export function GradntScrollView({
  children,
  padded = true,
  contentStyle,
  ...rest
}: GradntScrollViewProps) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[
        {
          paddingHorizontal: padded ? SCREEN_GUTTER : 0,
          paddingTop: SCREEN_GUTTER,
          paddingBottom: SCREEN_GUTTER,
        },
        contentStyle,
      ]}
      {...rest}
    >
      {children}
    </ScrollView>
  )
}
