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
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        borderRadius="$pill"
        backgroundColor={selected ? '$accent' : '$backgroundElevated'}
        borderWidth={1}
        borderColor={selected ? '$accent' : '$border'}
      >
        <GradntText color={selected ? '$onAccent' : '$textPrimary'} weight="semibold" fontSize={14}>
          {label}
        </GradntText>
      </XStack>
    </Pressable>
  )
}
