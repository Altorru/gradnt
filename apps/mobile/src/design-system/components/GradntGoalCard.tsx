import { ArrowUpRight } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { colors } from '../tokens'
import { GradntBadge, GradntHeading, GradntProgressBar, GradntText } from './primitives'

export function GradntGoalCard() {
  return (
    <YStack
      minHeight={250}
      borderRadius="$5"
      borderWidth={1}
      borderColor="$border"
      overflow="hidden"
      backgroundColor="$backgroundElevated"
      padding="$5"
      justifyContent="space-between"
      gap="$5"
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <YStack gap="$2">
          <GradntText muted weight="semibold" fontSize={12} letterSpacing={0.7}>
            OBJECTIF PRINCIPAL
          </GradntText>

          <GradntHeading level={3}>FTP</GradntHeading>

          <XStack alignItems="flex-end" gap="$2">
            <GradntText weight="bold" fontSize={38} lineHeight={39} letterSpacing={-1.6}>
              258
            </GradntText>

            <GradntText muted weight="semibold" fontSize={26} lineHeight={34}>
              → 280 W
            </GradntText>
          </XStack>
        </YStack>

        <GradntBadge tone="positive">EN BONNE VOIE</GradntBadge>
      </XStack>

      <YStack gap="$3">
        <XStack gap="$3" alignItems="center">
          <YStack flex={1}>
            <GradntProgressBar value={72} />
          </YStack>

          <GradntText weight="bold">72 %</GradntText>
        </XStack>

        <XStack alignItems="center" gap="$1">
          <GradntText color="$accent" weight="semibold" fontSize={14}>
            +6 W ce mois-ci
          </GradntText>

          <ArrowUpRight size={15} color={colors.lime} />
        </XStack>
      </YStack>
    </YStack>
  )
}
