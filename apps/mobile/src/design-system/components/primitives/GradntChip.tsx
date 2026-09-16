import { Pressable } from 'react-native'
import { XStack } from 'tamagui'

import { GradntText } from './GradntText'

type GradntChipProps = {
  label: string
  selected?: boolean
  onPress?: () => void
}

/**
 * One value among a small set, chosen by touch.
 *
 * A radio rather than a button: it is only ever one of a group, and "button,
 * selected" makes a screen reader say the same thing twice where "radio" gives
 * the role and the state in one.
 */
export function GradntChip({ label, selected = false, onPress }: GradntChipProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
    >
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
