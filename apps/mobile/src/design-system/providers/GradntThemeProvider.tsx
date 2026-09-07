import type { PropsWithChildren } from 'react'
import { TamaguiProvider } from 'tamagui'

import tamaguiConfig from '../../../tamagui.config'

export function GradntThemeProvider({ children }: PropsWithChildren) {
  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="dark">
      {children}
    </TamaguiProvider>
  )
}
