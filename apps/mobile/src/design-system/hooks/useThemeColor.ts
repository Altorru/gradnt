import { useTheme } from 'tamagui'

import type { darkTheme } from '../themes/dark'

/** Every colour role the GRADNT themes define. */
export type GradntThemeRole = keyof typeof darkTheme

/**
 * Resolves theme roles to plain colour strings.
 *
 * Tamagui tokens (`$accent`) work on Tamagui components — including the
 * `@tamagui/lucide-icons-2` icons, which are styled components. `react-native-svg`
 * is not: `stroke`, `fill` and `stopColor` are plain React Native props and need
 * an actual value.
 *
 * Hardcoding a palette entry there is what left the charts on the bright brand
 * lime while the rest of the theme moved to a deeper one.
 *
 * On native a theme value is a `Variable` and the colour is on `.val`; on web
 * the value is already the string.
 */
export function useThemeColor(): (role: GradntThemeRole) => string {
  const theme = useTheme()

  return (role) => {
    const value = theme[role]

    return typeof value === 'string' ? value : value.val
  }
}
