import type { PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Pressable } from 'react-native'
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect'
import { YStack } from 'tamagui'

type GradntGlassSurfaceProps = PropsWithChildren<{
  borderRadius: number
  style?: StyleProp<ViewStyle>
  /** Makes the whole surface a control. The glass only reacts to touch when it is one. */
  onPress?: () => void
  accessibilityLabel?: string
  disabled?: boolean
  /** Set while the control is working on the press, so a screen reader can say so. */
  busy?: boolean
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
  onPress,
  accessibilityLabel,
  disabled,
  busy,
}: GradntGlassSurfaceProps) {
  const surface =
    isLiquidGlassAvailable() && isGlassEffectAPIAvailable() ? (
      <GlassView
        glassEffectStyle="regular"
        // A surface that does nothing must not squish under the finger: that
        // promises a control that is not there.
        isInteractive={onPress !== undefined}
        style={[{ borderRadius, overflow: 'hidden' }, style]}
      >
        {children}
      </GlassView>
    ) : (
      <YStack
        borderRadius={borderRadius}
        borderWidth={1}
        borderColor="$border"
        backgroundColor="$backgroundElevated"
        overflow="hidden"
        style={style}
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
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
    >
      {surface}
    </Pressable>
  )
}
