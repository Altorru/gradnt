import type { PropsWithChildren } from 'react'
import { useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'

import tamaguiConfig from '../../../tamagui.config'

/**
 * Follows the system appearance, as `userInterfaceStyle: "automatic"` in
 * app.json declares.
 *
 * This used to be hardcoded to `"dark"`, which meant the app could never render
 * light — while the native tab bar, which follows the system on its own, went
 * light anyway. The two disagreed on any light-mode device.
 *
 * Components must take their colours from theme roles (`$textPrimary`, or
 * `useThemeColor`) rather than from the raw palette, or they will not follow.
 */
export function GradntThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={scheme === 'light' ? 'light' : 'dark'}>
      {children}
    </TamaguiProvider>
  )
}
