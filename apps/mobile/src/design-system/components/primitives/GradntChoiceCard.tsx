import type { ComponentType } from 'react'
import type { House } from '@tamagui/lucide-icons-2'
import { Pressable } from 'react-native'
import { XStack, YStack } from 'tamagui'

import { GradntText } from './GradntText'

/**
 * The icon component itself rather than a rendered node.
 *
 * The card owns the icon's tile, so it owns the tile's background and therefore
 * the colour that has to sit on it. When the caller supplied a node it had to
 * guess, and guessed green — a green glyph on an accent-filled tile, which is
 * what the selected discipline was showing.
 *
 * Derived from a concrete icon: the package does not export its icon type.
 */
type ChoiceIcon = typeof House | ComponentType<{ size?: number; color?: string }>

type GradntChoiceCardProps = {
  title: string
  description?: string
  selected?: boolean
  icon?: ChoiceIcon
  onPress?: () => void
}

export function GradntChoiceCard({
  title,
  description,
  selected = false,
  icon: Icon,
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
          // `accentInk`, not `accent`: a border and a title are ink on the card,
          // and the fill green is far too pale to read against a light one.
          borderColor={selected ? '$accentInk' : hovered || pressed ? '$borderStrong' : '$border'}
          backgroundColor={
            selected
              ? '$backgroundSubtle'
              : hovered || pressed
                ? '$backgroundSubtle'
                : '$backgroundElevated'
          }
        >
          {Icon ? (
            <YStack
              width={38}
              height={38}
              borderRadius={12}
              alignItems="center"
              justifyContent="center"
              // A genuine fill, so it keeps the fill green and the glyph on top
              // takes `onAccent` — the same pairing the primary button uses.
              backgroundColor={selected ? '$accent' : '$backgroundSubtle'}
            >
              <Icon size={19} color={selected ? '$onAccent' : '$textSecondary'} />
            </YStack>
          ) : null}

          <YStack flex={1} gap="$1">
            <GradntText weight="semibold" fontSize={14} color={selected ? '$accentInk' : '$color'}>
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
            borderColor={selected ? '$accentInk' : '$borderStrong'}
            alignItems="center"
            justifyContent="center"
          >
            {selected ? (
              <YStack width={8} height={8} borderRadius="$pill" backgroundColor="$accentInk" />
            ) : null}
          </YStack>
        </XStack>
      )}
    </Pressable>
  )
}
