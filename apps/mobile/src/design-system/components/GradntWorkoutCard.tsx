import { BarChart3, ChevronRight, Clock3 } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntMiniBars } from './charts'
import { GradntButton, GradntCard, GradntText } from './primitives'
import { useThemeColor } from '../hooks/useThemeColor'

type GradntWorkoutCardProps = {
  day: string
  title: string
  duration: string
  intensity: string
  actionLabel: string
  onPress?: () => void
}

/**
 * The next session, as a card.
 *
 * Presentational: it is handed the words, not a workout. It used to take a
 * `PlannedWorkout` and format it itself, with `fr-FR` and `'Voir la séance'`
 * written into the design system — so an English rider read the day and the
 * action in French whatever the app was set to. It also had demo values as its
 * prop defaults, which is what a caller passing `undefined` got: a plausible
 * session that was nobody's.
 */
export function GradntWorkoutCard({
  day,
  title,
  duration,
  intensity,
  actionLabel,
  onPress,
}: GradntWorkoutCardProps) {
  const themeColor = useThemeColor()
  return (
    <GradntCard premium padding="$4" gap="$4" borderRadius={20} borderColor="$borderStrong">
      <XStack alignItems="flex-end" justifyContent="space-between" gap="$3">
        <YStack flex={1} gap="$3">
          <YStack gap="$1">
            <GradntText muted weight="medium" fontSize={11} lineHeight={14} letterSpacing={0.65}>
              {day}
            </GradntText>

            <GradntText weight="bold" fontSize={21} lineHeight={25} letterSpacing={-0.5}>
              {title}
            </GradntText>
          </YStack>

          <XStack alignItems="center" flexWrap="wrap" gap="$3">
            <XStack alignItems="center" gap="$1">
              <Clock3 size={14} color={'$textSecondary'} />

              <GradntText muted fontSize={12}>
                {duration}
              </GradntText>
            </XStack>

            <XStack alignItems="center" gap="$1">
              <BarChart3 size={14} color={'$textSecondary'} />

              <GradntText muted fontSize={12}>
                {intensity}
              </GradntText>
            </XStack>
          </XStack>
        </YStack>

        <YStack width={76} height={54} justifyContent="flex-end">
          <GradntMiniBars
            data={[12, 42, 14, 42, 14, 42, 12]}
            activeIndices={[1, 3, 5]}
            height={48}
            gap={4}
          />
        </YStack>
      </XStack>

      <GradntButton
        minHeight={46}
        borderRadius={15}
        iconAfter={<ChevronRight size={17} color={themeColor('onAccent') as never} />}
        onPress={onPress}
      >
        {actionLabel}
      </GradntButton>
    </GradntCard>
  )
}
