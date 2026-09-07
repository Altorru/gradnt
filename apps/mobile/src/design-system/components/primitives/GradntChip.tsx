import { Pressable } from 'react-native'
import { XStack } from 'tamagui'

import { GradntText } from './GradntText'

type GradntChipProps = {
  label: string
  selected?: boolean
  onPress?: () => void
}

export function GradntChip({ label, selected = false, onPress }: GradntChipProps) {
  return (
    <Pressable onPress={onPress}>
      {({ hovered, pressed }) => (
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          borderRadius="$pill"
          backgroundColor={
            selected ? '$accent' : hovered || pressed ? '$backgroundSubtle' : '$backgroundElevated'
          }
          borderWidth={1}
          borderColor={selected ? '$accent' : hovered || pressed ? '$borderStrong' : '$border'}
        >
          <GradntText color={selected ? '$onAccent' : '$color'} weight="semibold" fontSize={14}>
            {label}
          </GradntText>
        </XStack>
      )}
    </Pressable>
  )
}
