import type { ColorSchemeName } from 'react-native'
import { useColorScheme } from 'react-native'

import type { ColorScheme } from '@/design-system'
import { usePreferencesStore } from '@/features/app/store/preferences.store'
import type { AppearancePreference } from '@/services/preferences/preferences.persistence'

/**
 * The appearance to render in.
 *
 * Anything that is not an explicit `light` is dark, which is the same rule
 * `openFreeMapStyleUrl` applies to the map and the app applied to itself before
 * there was a choice — it shipped dark for long enough that dark is the safe
 * answer for a system that has not said.
 *
 * Pure, so the three preferences can be checked without a renderer or a phone.
 */
export function resolveScheme(
  preference: AppearancePreference,
  system: ColorSchemeName,
): ColorScheme {
  if (preference === 'system') {
    return system === 'light' ? 'light' : 'dark'
  }

  return preference
}

/**
 * The preference, with `system` resolved against the phone.
 *
 * Read once at the root and published through the theme provider, so every
 * consumer — the navigator, the maps, anything picking an asset — sees the same
 * answer rather than each asking the system for itself.
 */
export function useResolvedScheme(): ColorScheme {
  const preference = usePreferencesStore((state) => state.appearance)
  const system = useColorScheme()

  return resolveScheme(preference, system)
}
