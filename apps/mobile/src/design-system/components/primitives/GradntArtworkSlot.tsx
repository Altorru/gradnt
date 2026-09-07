import type { ComponentProps } from 'react'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { YStack } from 'tamagui'

type GradntArtworkSlotProps = {
  source?: ComponentProps<typeof Image>['source']
  height?: number
  rounded?: number
  shaded?: boolean
}

export function GradntArtworkSlot({
  source,
  height = 118,
  rounded = 18,
  shaded = true,
}: GradntArtworkSlotProps) {
  return (
    <YStack
      position="relative"
      overflow="hidden"
      width="100%"
      height={height}
      borderRadius={rounded}
      backgroundColor="$backgroundSubtle"
      borderWidth={1}
      borderColor="$borderStrong"
    >
      {source ? (
        <>
          <Image
            source={source}
            contentFit="cover"
            contentPosition="center"
            transition={180}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />

          {shaded ? (
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(12,14,11,0.00)', 'rgba(12,14,11,0.04)', 'rgba(12,14,11,0.28)']}
              locations={[0, 0.55, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
              }}
            />
          ) : null}
        </>
      ) : null}
    </YStack>
  )
}
