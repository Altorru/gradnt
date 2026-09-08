import type { PropsWithChildren, ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'

import { GradntBottomNav, GradntMobileShell } from '@/design-system'

export function AppShell({ children, header }: PropsWithChildren<{ header?: ReactNode }>) {
  const insets = useSafeAreaInsets()

  return (
    <GradntMobileShell>
      <YStack flex={1} backgroundColor="$background">
        <YStack flex={1} paddingTop={insets.top}>
          {header}
          {children}
        </YStack>
        <GradntBottomNav />
      </YStack>
    </GradntMobileShell>
  )
}

export function AppScrollView({ children }: PropsWithChildren) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 28,
      }}
    >
      {children}
    </ScrollView>
  )
}

export function AppHeader({ children }: PropsWithChildren) {
  return (
    <XStack paddingHorizontal={18} paddingTop="$4" paddingBottom="$2" alignItems="center">
      {children}
    </XStack>
  )
}
