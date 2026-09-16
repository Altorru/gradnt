import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { OnboardingHydration } from '@/features/onboarding/components/OnboardingHydration'
import { PreferencesHydration } from '@/features/app/components/PreferencesHydration'
import { GradntFontProvider, GradntQueryProvider, GradntThemeProvider } from '@/design-system'
import { useResolvedScheme } from '@/hooks/use-resolved-scheme'

export default function RootLayout() {
  const scheme = useResolvedScheme()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        {/* Outside the theme provider on purpose: the chosen appearance has to
            be known before the first paint, not one frame after it. */}
        <PreferencesHydration>
          <GradntFontProvider>
            <OnboardingHydration>
              <GradntQueryProvider>
                <GradntThemeProvider scheme={scheme}>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                    }}
                  />
                </GradntThemeProvider>
              </GradntQueryProvider>
            </OnboardingHydration>
          </GradntFontProvider>
        </PreferencesHydration>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
