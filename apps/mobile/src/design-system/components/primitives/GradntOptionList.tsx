import { Check } from '@tamagui/lucide-icons-2'
import { Pressable } from 'react-native'
import { XStack, YStack } from 'tamagui'

import { GradntText } from './GradntText'

type Option<T extends string> = {
  value: T
  label: string
}

type GradntOptionListProps<T extends string> = {
  label: string
  options: readonly Option<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * A labelled list of options, one per row, with a check on the chosen one.
 *
 * A wrapping row of chips reads well for two or three short words and badly past
 * that: the options shuffle onto a second line, the eye has no left edge to run
 * down, and the selected one is only distinguishable by a fill. A column gives
 * every option the same left edge and its own full-width target, and the check
 * says which is on without relying on colour.
 *
 * The rows share one border and are divided from each other, which is the shape
 * a list of choices takes on both platforms — a group of rows, not a stack of
 * separate boxes.
 */
export function GradntOptionList<T extends string>({
  label,
  options,
  value,
  onChange,
}: GradntOptionListProps<T>) {
  return (
    <YStack gap="$2">
      <GradntText muted fontSize={11} weight="semibold" letterSpacing={1}>
        {label.toUpperCase()}
      </GradntText>

      <YStack borderWidth={1} borderColor="$border" borderRadius={14} overflow="hidden">
        {options.map((option, index) => {
          const selected = option.value === value

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
            >
              {({ pressed }) => (
                <XStack
                  alignItems="center"
                  justifyContent="space-between"
                  gap="$3"
                  minHeight={48}
                  paddingHorizontal="$4"
                  // Dividing lines between rows, not around them: the group has
                  // one outline and the rows are its parts.
                  borderTopWidth={index === 0 ? 0 : 1}
                  borderColor="$border"
                  backgroundColor={pressed ? '$backgroundSubtle' : 'transparent'}
                >
                  <GradntText color={selected ? '$accentInk' : '$color'} fontSize={14}>
                    {option.label}
                  </GradntText>

                  {/* A mark rather than ink, so the green holds on both themes
                      while the label above stays legible. */}
                  {selected ? <Check size={18} color="$accent" /> : null}
                </XStack>
              )}
            </Pressable>
          )
        })}
      </YStack>
    </YStack>
  )
}
