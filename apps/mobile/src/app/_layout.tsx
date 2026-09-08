import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { GradntFontProvider, GradntQueryProvider, GradntThemeProvider } from '@/design-system'

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <GradntFontProvider>
          <GradntQueryProvider>
            <GradntThemeProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </GradntThemeProvider>
          </GradntQueryProvider>
        </GradntFontProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
