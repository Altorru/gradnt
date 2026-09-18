import { Stack } from 'expo-router'
import { PortalProvider } from '@gorhom/portal'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { OnboardingHydration } from '@/features/onboarding/components/OnboardingHydration'
import { NotificationObserver } from '@/features/app/components/NotificationObserver'
import { PreferencesHydration } from '@/features/app/components/PreferencesHydration'
import { GradntFontProvider, GradntQueryProvider, GradntThemeProvider } from '@/design-system'
import { useResolvedScheme } from '@/hooks/use-resolved-scheme'
import { useNotificationSync } from '@/features/app/hooks/use-notification-sync'
import { AuthLifecycle } from '@/features/auth/components/AuthLifecycle'

/**
 * Brings the scheduled notifications in step with the plan, and renders nothing.
 *
 * A component rather than a call in `RootLayout`, because it has to sit inside
 * both the hydration and the query provider — and a hook cannot be mounted
 * conditionally in the middle of a tree that has not rendered yet.
 */
function GradntNotificationSync() {
  useNotificationSync()

  return null
}

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
                <AuthLifecycle />
                {/* Inside the query provider, which the sync reads through, and
                    inside hydration, without which it would schedule defaults. */}
                <GradntNotificationSync />

                <GradntThemeProvider scheme={scheme}>
                  <PortalProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                      }}
                    />
                  </PortalProvider>
                </GradntThemeProvider>
              </GradntQueryProvider>
            </OnboardingHydration>
          </GradntFontProvider>
        </PreferencesHydration>

        <NotificationObserver />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
