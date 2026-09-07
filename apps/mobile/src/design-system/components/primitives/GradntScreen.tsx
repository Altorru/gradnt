import type { PropsWithChildren } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { YStack } from 'tamagui'

type GradntScreenProps = PropsWithChildren<{
  padded?: boolean
}>

export function GradntScreen({ children, padded = true }: GradntScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack
        flex={1}
        backgroundColor="$background"
        paddingHorizontal={padded ? '$5' : '$0'}
        paddingVertical={padded ? '$4' : '$0'}
      >
        {children}
      </YStack>
    </SafeAreaView>
  )
}
