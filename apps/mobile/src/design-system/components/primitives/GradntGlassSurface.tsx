import { useState, type PropsWithChildren } from 'react'
import type {
  AccessibilityRole,
  AccessibilityState,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { Pressable } from 'react-native'
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect'
import { YStack } from 'tamagui'

type GradntGlassSurfaceProps = PropsWithChildren<{
  /**
   * Corner radius in points, or `'pill'` for a capsule.
   *
   * A capsule is measured rather than written as a big number, because the two
   * platforms treat an oversized radius differently. The fallback clamps one to
   * a capsule and looks right; the native glass folds it into the effect's
   * corner configuration, where a radius far larger than the surface leaves no
   * glass drawn at all. Half the height is the one value that is a capsule at
   * every text size, and the one the native path is known to accept.
   */
  borderRadius: number | 'pill'
  style?: StyleProp<ViewStyle>
  /** Colours the surface, for a state worth noticing. A resolved colour, not a token. */
  tintColor?: string
  /** Makes the whole surface a control. The glass only reacts to touch when it is one. */
  onPress?: () => void
  accessibilityLabel?: string
  /** `radio` for one value among a set, `button` for a one-off action. */
  accessibilityRole?: AccessibilityRole
  accessibilityState?: AccessibilityState
  disabled?: boolean
}>

/**
 * A floating surface: Liquid Glass where the system has it, a solid panel
 * everywhere else.
 *
 * The glass is not a look to imitate — it is a material that refracts whatever
 * passes beneath it, and imitating it with a translucent colour gives a flat
 * wash instead. That is exactly what the controls over the map need: real map
 * showing through, not a grey pill with opacity.
 *
 * Both availability checks, because they answer different questions.
 * `isLiquidGlassAvailable` says the design is in use; `isGlassEffectAPIAvailable`
 * says the runtime actually has the API, which some iOS 26 betas do not — and
 * rendering `GlassView` there crashes rather than degrading.
 *
 * The fallback is not decoration. It is what Android and web get, and it is what
 * iOS gets when the system API is missing.
 */
export function GradntGlassSurface({
  children,
  borderRadius,
  style,
  tintColor,
  onPress,
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  disabled,
}: GradntGlassSurfaceProps) {
  const [measuredHeight, setMeasuredHeight] = useState(0)

  const cornerRadius = borderRadius === 'pill' ? measuredHeight / 2 : borderRadius

  // On both branches. Measuring only where the glass renders left the fallback
  // at a radius of zero, which is a square pill with a visible outline — the
  // one platform that clamps an oversized radius was the one that needed it.
  const measure =
    borderRadius === 'pill'
      ? {
          onLayout: (event: LayoutChangeEvent) =>
            setMeasuredHeight(event.nativeEvent.layout.height),
        }
      : {}

  const surface =
    isLiquidGlassAvailable() && isGlassEffectAPIAvailable() ? (
      <GlassView
        glassEffectStyle="regular"
        tintColor={tintColor}
        // A surface that does nothing must not squish under the finger: that
        // promises a control that is not there.
        isInteractive={onPress !== undefined}
        {...measure}
        style={[{ borderRadius: cornerRadius, overflow: 'hidden' }, style]}
      >
        {children}
      </GlassView>
    ) : (
      <YStack
        borderRadius={cornerRadius}
        borderWidth={1}
        borderColor="$border"
        // A tint arrives resolved rather than as a token, and Tamagui's prop
        // only takes the latter — so it goes through the style, where the
        // caller's own style still has the last word.
        backgroundColor={tintColor ? undefined : '$backgroundElevated'}
        overflow="hidden"
        {...measure}
        style={[tintColor ? { backgroundColor: tintColor } : null, style]}
      >
        {children}
      </YStack>
    )

  if (!onPress) {
    return surface
  }

  // Pressable outside the glass, which is the pattern Expo documents: the glass
  // supplies the native touch feedback, the Pressable supplies the handler.
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, ...accessibilityState }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
    >
      {surface}
    </Pressable>
  )
}
