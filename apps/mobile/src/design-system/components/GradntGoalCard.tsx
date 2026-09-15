import type { Goal } from '@/lib/domain'

import { ArrowUpRight } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { gradntAssets } from '../assets'
import { GradntHeroArtwork } from './composites/GradntHeroArtwork'
import { GradntBadge, GradntCard, GradntHeading, GradntProgressBar, GradntText } from './primitives'

type GradntGoalCardProps = {
  goal?: Goal
  currentValue?: number | null
  progressPercentage?: number
  changeLabel?: string
  statusLabel?: string
}

export function GradntGoalCard({
  goal,
  currentValue,
  progressPercentage,
  changeLabel,
  statusLabel,
}: GradntGoalCardProps) {
  const isPreview = goal === undefined
  const currentGoalValue = isPreview ? (currentValue ?? 258) : currentValue
  const goalValue = isPreview ? 280 : goal.targetValue
  const progressValue = isPreview ? (progressPercentage ?? 72) : (progressPercentage ?? 0)
  const goalUnit = isPreview ? 'W' : goal.targetUnit === 'w' ? 'W' : goal.targetUnit
  const resolvedChangeLabel =
    changeLabel ?? (isPreview ? '+6 W ce mois-ci' : 'Progression à préciser')
  const resolvedStatusLabel = statusLabel ?? (isPreview ? 'EN BONNE VOIE' : 'POINT DE DÉPART')

  return (
    <GradntCard
      premium
      minHeight={304}
      padding="$5"
      gap="$3"
      overflow="hidden"
      borderColor="$borderStrong"
      borderRadius={22}
    >
      <GradntHeroArtwork source={gradntAssets.goals.ftpClimbDark} />

      {/* HEADER */}
      <XStack zIndex={2} justifyContent="space-between" alignItems="flex-start">
        <YStack gap="$2" flexShrink={1}>
          <GradntText muted weight="semibold" fontSize={11} lineHeight={14} letterSpacing={1.15}>
            OBJECTIF PRINCIPAL
          </GradntText>

          <GradntHeading level={3} fontSize={19} lineHeight={23}>
            {goal?.type === 'ftp'
              ? 'FTP'
              : goal?.type === 'distance'
                ? 'DISTANCE'
                : goal?.type === 'climbing'
                  ? 'DÉNIVELÉ'
                  : 'OBJECTIF'}
          </GradntHeading>

          <XStack alignItems="center" gap="$2">
            <GradntText weight="bold" fontSize={36} lineHeight={38} letterSpacing={-1.7}>
              {currentGoalValue ?? '—'}
            </GradntText>

            <GradntText muted weight="semibold" fontSize={23} lineHeight={30} letterSpacing={-0.6}>
              {goalValue !== null ? `→ ${goalValue} ${goalUnit}` : 'Objectif à préciser'}
            </GradntText>
          </XStack>
        </YStack>

        <GradntBadge tone="positive">{resolvedStatusLabel}</GradntBadge>
      </XStack>

      {/* Zone réservée à l'artwork.
          Aucun rectangle, aucune bordure. */}
      <YStack zIndex={1} height={92} pointerEvents="none" />

      {/* FOOTER */}
      <YStack zIndex={2} gap="$3" marginTop="auto">
        <XStack alignItems="center" gap="$3">
          <YStack flex={1}>
            <GradntProgressBar value={progressValue} height={8} />
          </YStack>

          <GradntText weight="bold" fontSize={17} lineHeight={20}>
            {progressValue} %
          </GradntText>
        </XStack>

        <XStack alignItems="center" gap="$1">
          <GradntText color="$accentInk" weight="semibold" fontSize={13} lineHeight={17}>
            {resolvedChangeLabel}
          </GradntText>

          <ArrowUpRight size={14} color="$accentInk" />
        </XStack>
      </YStack>
    </GradntCard>
  )
}
