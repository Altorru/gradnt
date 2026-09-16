import { createContext, useContext } from 'react'

export type ColorScheme = 'light' | 'dark'

/**
 * The appearance the app is actually rendering in.
 *
 * Published by `GradntThemeProvider` rather than read from `useColorScheme()`,
 * because the system's answer is only one of the three a rider can choose. A
 * component that picks an asset, a veil or a map style by appearance has to
 * pick the one that is on screen, not the one the phone would have picked.
 *
 * Dark is the fallback for a component rendered outside the provider, which is
 * what the app was before it had a light theme.
 */
export const GradntSchemeContext = createContext<ColorScheme>('dark')

export function useGradntScheme(): ColorScheme {
  return useContext(GradntSchemeContext)
}
