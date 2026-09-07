import { BarChart3, ChevronRight, Clock3 } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { colors } from '../tokens'
import { GradntArtworkSlot, GradntButton, GradntCard, GradntText } from './primitives'

export function GradntWorkoutCard() {
  return (
    <GradntCard minHeight={250} borderColor="$borderStrong" padding="$5" gap="$4">
      <YStack gap="$1">
        <GradntText muted weight="medium" fontSize={12} letterSpacing={0.5}>
          VENDREDI 12 AVR.
        </GradntText>

        <GradntText weight="bold" fontSize={22} lineHeight={26}>
          Sweet Spot
        </GradntText>
      </YStack>

      <GradntArtworkSlot height={82} />

      <XStack alignItems="center" flexWrap="wrap" gap="$3">
        <XStack alignItems="center" gap="$1">
          <Clock3 size={15} color={colors.stone400} />

          <GradntText muted fontSize={13}>
            1 h 15
          </GradntText>
        </XStack>

        <XStack alignItems="center" gap="$1">
          <BarChart3 size={15} color={colors.stone400} />

          <GradntText muted fontSize={13}>
            3 × 12 min · 88–94 % FTP
          </GradntText>
        </XStack>
      </XStack>

      <GradntButton iconAfter={<ChevronRight size={18} color={colors.graphite950} />}>
        Voir la séance
      </GradntButton>
    </GradntCard>
  )
}
