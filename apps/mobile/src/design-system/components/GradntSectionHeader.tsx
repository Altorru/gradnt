import { ChevronRight } from '@tamagui/lucide-icons-2'
import { Pressable } from 'react-native'
import { XStack } from 'tamagui'
import { GradntHeading, GradntText } from './primitives'

type GradntSectionHeaderProps = {
  title: string
  /** Label for the section's action. Rendered only when `onPress` is given too. */
  action?: string
  onPress?: () => void
}

/**
 * Section title with an optional action.
 *
 * The action renders only when it can actually be pressed. A label with a
 * chevron reads as navigation — a chevron that does nothing is worse than no
 * chevron at all, and every section on the home screen used to say "Voir…"
 * without being tappable. Requiring both props makes that unreachable.
 */
export function GradntSectionHeader({ title, action, onPress }: GradntSectionHeaderProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between">
      <GradntHeading level={3}>{title}</GradntHeading>

      {action && onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action}
          onPress={onPress}
          hitSlop={8}
        >
          {({ pressed }) => (
            <XStack alignItems="center" gap="$1" opacity={pressed ? 0.6 : 1}>
              <GradntText muted fontSize={13}>
                {action}
              </GradntText>

              <ChevronRight size={15} color="$textSecondary" />
            </XStack>
          )}
        </Pressable>
      ) : null}
    </XStack>
  )
}
