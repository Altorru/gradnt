import type { ImageSource } from 'expo-image'
import { Image } from 'expo-image'
import { YStack } from 'tamagui'

type GradntArtworkSlotProps = {
  source?: ImageSource
  height?: number
  rounded?: number
}

export function GradntArtworkSlot({ source, height = 120, rounded = 18 }: GradntArtworkSlotProps) {
  return (
    <YStack
      position="relative"
      overflow="hidden"
      width="100%"
      height={height}
      borderRadius={rounded}
      backgroundColor="$backgroundSubtle"
      borderWidth={1}
      borderColor="$border"
    >
      {source ? (
        <Image
          source={source}
          contentFit="cover"
          transition={180}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      ) : null}
    </YStack>
  )
}
