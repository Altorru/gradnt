import type { PropsWithChildren } from 'react'
import { View } from 'react-native'
import { YStack } from 'tamagui'

export function GradntMobileShell({ children }: PropsWithChildren) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <YStack flex={1} width="100%" maxWidth={430} backgroundColor="$background" overflow="hidden">
        {children}
      </YStack>
    </View>
  )
}
