import type { PropsWithChildren } from 'react'
import { useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'

import tamaguiConfig from '../../../tamagui.config'

export function GradntThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme()
  const themeName = colorScheme === 'light' ? 'gradntLight' : 'gradntDark'

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={themeName}>
      {children}
    </TamaguiProvider>
  )
}
