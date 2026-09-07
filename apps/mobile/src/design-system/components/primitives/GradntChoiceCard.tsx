import type { ReactNode } from 'react'
import { Pressable } from 'react-native'
import { XStack, YStack } from 'tamagui'

import { GradntText } from './GradntText'

type GradntChoiceCardProps = {
  title: string
  description?: string
  selected?: boolean
  icon?: ReactNode
  onPress?: () => void
}

export function GradntChoiceCard({
  title,
  description,
  selected = false,
  icon,
  onPress,
}: GradntChoiceCardProps) {
  return (
    <Pressable onPress={onPress}>
      {({ hovered, pressed }) => (
        <XStack
          minHeight={72}
          padding="$4"
          gap="$3"
          alignItems="center"
          borderWidth={1}
          borderRadius={18}
          borderColor={selected ? '$accent' : hovered || pressed ? '$borderStrong' : '$border'}
          backgroundColor={
            selected
              ? '$backgroundSubtle'
              : hovered || pressed
                ? '$backgroundSubtle'
                : '$backgroundElevated'
          }
        >
          {icon ? (
            <YStack
              width={38}
              height={38}
              borderRadius={12}
              alignItems="center"
              justifyContent="center"
              backgroundColor={selected ? '$accent' : '$backgroundSubtle'}
            >
              {icon}
            </YStack>
          ) : null}

          <YStack flex={1} gap="$1">
            <GradntText weight="semibold" fontSize={14} color={selected ? '$accent' : '$color'}>
              {title}
            </GradntText>

            {description ? (
              <GradntText muted fontSize={12} lineHeight={17}>
                {description}
              </GradntText>
            ) : null}
          </YStack>

          <YStack
            width={18}
            height={18}
            borderRadius="$pill"
            borderWidth={2}
            borderColor={selected ? '$accent' : '$borderStrong'}
            alignItems="center"
            justifyContent="center"
          >
            {selected ? (
              <YStack width={8} height={8} borderRadius="$pill" backgroundColor="$accent" />
            ) : null}
          </YStack>
        </XStack>
      )}
    </Pressable>
  )
}
