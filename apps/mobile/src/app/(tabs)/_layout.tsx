import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { Platform, useColorScheme } from 'react-native'
import { useTheme } from 'tamagui'

/**
 * Applies an alpha channel to a theme colour.
 *
 * A Material ripple is a translucent wash over the bar; the theme roles are
 * opaque, so passing one straight through gives a solid flash instead. Falls
 * back to the colour unchanged when it is not a six-digit hex, rather than
 * emitting an invalid value.
 */
function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex
}

/**
 * The app's five destinations.
 *
 * These are real tabs, not routes pushed onto a stack: each screen stays
 * mounted, keeps its scroll position and state, and switching does not grow the
 * navigation history. Previously the bottom bar called `router.push` for every
 * destination, so each switch stacked another screen, remounted it, and
 * animated like drilling deeper.
 *
 * Expo Router 57 is SDK 57, where this API still lives under
 * `unstable-native-tabs`; the stable `native-tabs` path arrives in SDK 58.
 */
export default function TabsLayout() {
  const theme = useTheme()
  const scheme = useColorScheme()

  /**
   * Reads a role from the active theme.
   *
   * Throws rather than falling back: every role below is defined by both
   * themes, so a miss is a typo, and a silent fallback is how an unreadable bar
   * ships.
   */
  const color = (
    role: 'backgroundElevated' | 'textPrimary' | 'textSecondary' | 'accent',
  ): string => {
    const value = theme[role]

    if (value === undefined) {
      throw new Error(`Theme role "${role}" is not defined`)
    }

    return typeof value === 'string' ? value : value.val
  }

  /**
   * The selected tab is the brand accent on dark, but a dark ink on light:
   * the accent is a near-white lime there and reads as glare on a pale bar.
   */
  const selectedColor = scheme === 'light' ? color('textPrimary') : color('accent')

  /**
   * Android takes its tab bar colours from Material You, which derives them
   * from the device wallpaper and ignores light/dark entirely — so the bar kept
   * its palette while the rest of the app switched.
   *
   * Guarded by platform rather than passed unconditionally: `backgroundColor`
   * and `iconColor` also drive iOS, where the native bar already follows the
   * system and should keep its own material.
   */
  const androidColors = Platform.select({
    android: {
      backgroundColor: color('backgroundElevated'),
      iconColor: color('textSecondary'),
      selectedIconColor: selectedColor,
      labelStyle: { color: color('textSecondary') },
      selectedLabelStyle: { color: selectedColor },
      // Left unset, this is Material You's wallpaper-derived primary.
      rippleColor: withAlpha(color('accent'), '1F'),
    },
    default: {},
  })

  return (
    <NativeTabs disableIndicator labelVisibilityMode="labeled" {...androidColors}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Progrès</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explorer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="garage">
        <NativeTabs.Trigger.Label>Garage</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bicycle" md="directions_bike" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
