import type { Goal } from '@/lib/domain'

import { ArrowUpRight } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { gradntAssets } from '../assets'
import { useGradntScheme } from '../hooks/scheme'
import { GradntHeroArtwork } from './composites/GradntHeroArtwork'
import { GradntBadge, GradntCard, GradntHeading, GradntProgressBar, GradntText } from './primitives'

/**
 * Every type is named here. `event` and `fitness` used to fall through to a
 * generic "OBJECTIF", so a rider who had picked one could not tell which.
 */
const GOAL_TYPE_TITLES = {
  ftp: 'FTP',
  distance: 'DISTANCE',
  climbing: 'DÉNIVELÉ',
  event: 'ÉVÉNEMENT',
  fitness: 'FORME',
} as const satisfies Record<Goal['type'], string>

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
  // The artwork has a light and a dark variant, and the dark one was wired up
  // for both themes — a dark illustration on a pale card. Assets are not theme
  // tokens, so this is where the choice is made.
  const scheme = useGradntScheme()
  const artwork =
    scheme === 'light' ? gradntAssets.goals.ftpClimbLight : gradntAssets.goals.ftpClimbDark
  /**
   * Nothing here invents a figure.
   *
   * This used to stand in 258 W, 280 W, 72 % and "+6 W ce mois-ci" whenever no
   * goal was passed. That branch was reachable in the app and not only in the
   * design-system preview, so a rider without a goal could be shown a
   * fabricated 258. Absent values now read as absent.
   */
  const goalValue = goal?.targetValue ?? null
  const currentGoalValue = currentValue ?? null
  const progressValue = progressPercentage ?? 0
  const goalUnit = goal?.targetUnit === 'w' ? 'W' : (goal?.targetUnit ?? '')
  const resolvedChangeLabel = changeLabel ?? 'Progression à préciser'
  const resolvedStatusLabel = statusLabel ?? 'POINT DE DÉPART'

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
      <GradntHeroArtwork source={artwork} />

      {/* HEADER */}
      <XStack zIndex={2} justifyContent="space-between" alignItems="flex-start">
        <YStack gap="$2" flexShrink={1}>
          <GradntText muted weight="semibold" fontSize={11} lineHeight={14} letterSpacing={1.15}>
            OBJECTIF PRINCIPAL
          </GradntText>

          <GradntHeading level={3} fontSize={19} lineHeight={23}>
            {goal ? GOAL_TYPE_TITLES[goal.type] : 'OBJECTIF'}
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
