import type { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'tamagui'

import tamaguiConfig from '../../../tamagui.config'
import { GradntSchemeContext, type ColorScheme } from '../hooks/scheme'

/**
 * Publishes the appearance the app is rendering in.
 *
 * The scheme arrives as a prop rather than being read here, because the choice
 * belongs to the app, not to the design system: a rider can force light or dark
 * regardless of the phone, and only the app knows which one they picked.
 *
 * Tamagui is told through `defaultTheme`, which it recomputes on every render
 * of this provider — so passing a different value from state is what switches
 * the theme. There is no `setTheme` to call.
 *
 * The same value goes into a context of our own, because Tamagui's theme is
 * read as styles rather than as an answer: a component that has to choose an
 * asset or a map style needs to know *which* appearance is on, not what colour
 * a token resolves to.
 */
export function GradntThemeProvider({
  scheme,
  children,
}: PropsWithChildren<{ scheme: ColorScheme }>) {
  return (
    <GradntSchemeContext.Provider value={scheme}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme}>
        {children}
      </TamaguiProvider>
    </GradntSchemeContext.Provider>
  )
}
