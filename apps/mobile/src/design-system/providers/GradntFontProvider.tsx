import type { PropsWithChildren } from 'react'
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist'

export function GradntFontProvider({ children }: PropsWithChildren) {
  const [loaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  })

  if (!loaded) {
    return null
  }

  return children
}
