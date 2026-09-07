import { BarChart3, ChevronRight, Clock3 } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntMiniBars } from './charts'
import { GradntButton, GradntCard, GradntText } from './primitives'
import { colors } from '../tokens'

type GradntWorkoutCardProps = {
  day?: string
  title?: string
  duration?: string
  description?: string
}

export function GradntWorkoutCard({
  day = 'VENDREDI 12 AVR.',
  title = 'Sweet Spot',
  duration = '1 h 15',
  description = '3 × 12 min · 88–94 % FTP',
}: GradntWorkoutCardProps) {
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
              <Clock3 size={14} color={colors.stone400} />

              <GradntText muted fontSize={12}>
                {duration}
              </GradntText>
            </XStack>

            <XStack alignItems="center" gap="$1">
              <BarChart3 size={14} color={colors.stone400} />

              <GradntText muted fontSize={12}>
                {description}
              </GradntText>
            </XStack>
          </XStack>
        </YStack>

        <YStack width={76} height={54} justifyContent="flex-end">
          <GradntMiniBars
            data={[12, 42, 14, 42, 14, 42, 12]}
            activeIndices={[1, 3, 5]}
            width={76}
            height={48}
            gap={4}
          />
        </YStack>
      </XStack>

      <GradntButton
        minHeight={46}
        borderRadius={15}
        iconAfter={<ChevronRight size={17} color={colors.graphite950} />}
      >
        Voir la séance
      </GradntButton>
    </GradntCard>
  )
}
