import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { Platform, useColorScheme } from 'react-native'
import { useTheme } from 'tamagui'

import { withAlpha } from '@/design-system'

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
  const color = (role: 'backgroundElevated' | 'textSecondary' | 'accent' | 'accentInk'): string => {
    const value = theme[role]

    if (value === undefined) {
      throw new Error(`Theme role "${role}" is not defined`)
    }

    return typeof value === 'string' ? value : value.val
  }

  /**
   * The active tab is green in both themes — but not the *same* green.
   *
   * On light the vivid accent is a near-white lime: measured against a pale bar
   * it is 1.2:1, so it would read as no highlight at all. Light therefore takes
   * the ink green (6:1); dark takes the brand accent, which has room to pop
   * against the inactive grey.
   */
  const selectedColor = scheme === 'light' ? color('accentInk') : color('accent')

  /**
   * Android takes its tab bar colours from Material You, which derives them
   * from the device wallpaper and ignores light/dark entirely — so the bar kept
   * its palette while the rest of the app switched.
   *
   * Guarded by platform rather than passed unconditionally: these props also
   * drive iOS, where the native bar already follows the system and should keep
   * its own material.
   *
   * The selected state goes through `tintColor`. `selectedIconColor` and
   * `selectedLabelStyle` look like the obvious props and type-check on the host,
   * but the navigator never reads them there — they are `Trigger` props, and on
   * `<NativeTabs>` they fall into the rest spread and vanish. That is how the
   * active tab ended up with no highlight at all once the indicator was off.
   *
   * The active indicator pill is deliberately left ON, tinted with the accent.
   * It is the native Android treatment for the active tab, and the closest this
   * platform gets to the filled glyph iOS shows — `md` symbols cannot switch
   * between outline and filled, since Material's fill is a variable-font axis
   * and `unstable_getMaterialSymbolSourceAsync` exposes no parameter for it.
   */
  const androidColors = Platform.select({
    android: {
      backgroundColor: color('backgroundElevated'),
      // Inactive tabs.
      iconColor: color('textSecondary'),
      labelStyle: { color: color('textSecondary') },
      // Active tab: drives the icon and the label together.
      tintColor: selectedColor,
      // Behind the active icon. Left unset, this is Material You's
      // wallpaper-derived secondaryContainer.
      indicatorColor: withAlpha(color('accent'), 0.15),
      // Left unset, this is Material You's wallpaper-derived primary.
      rippleColor: withAlpha(color('accent'), 0.12),
    },
    default: {},
  })

  return (
    <NativeTabs labelVisibilityMode="labeled" {...androidColors}>
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="plan">
        <NativeTabs.Trigger.Label>Plan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="calendar" md="calendar_month" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Progrès</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>Explorer</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="garage">
        <NativeTabs.Trigger.Label>Garage</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bicycle" md="directions_bike" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
