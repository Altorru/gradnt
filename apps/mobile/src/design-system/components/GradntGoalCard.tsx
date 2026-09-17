import { ArrowUpRight } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { gradntAssets } from '../assets'
import { useGradntScheme } from '../hooks/scheme'
import { GradntHeroArtwork } from './composites/GradntHeroArtwork'
import { GradntBadge, GradntCard, GradntHeading, GradntProgressBar, GradntText } from './primitives'

type GradntGoalCardProps = {
  eyebrow: string
  goalLabel: string
  targetLabel: string
  statusLabel: string
  changeLabel: string
  currentValue: number | null
  progressPercentage: number
}

/**
 * Where the rider stands relative to their goal.
 *
 * Presentational, and every word is a prop. It used to hold French of its own —
 * `OBJECTIF PRINCIPAL`, `'Objectif à préciser'`, and a `GOAL_TYPE_TITLES` map
 * that was a third copy of the goal vocabulary already in the catalogue — so an
 * English rider read French on the first screen of the app.
 */
export function GradntGoalCard({
  eyebrow,
  goalLabel,
  targetLabel,
  statusLabel,
  changeLabel,
  currentValue,
  progressPercentage,
}: GradntGoalCardProps) {
  // The artwork has a light and a dark variant, and the dark one was wired up
  // for both themes — a dark illustration on a pale card. Assets are not theme
  // tokens, so this is where the choice is made.
  const scheme = useGradntScheme()
  const artwork =
    scheme === 'light' ? gradntAssets.goals.ftpClimbLight : gradntAssets.goals.ftpClimbDark

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
            {eyebrow}
          </GradntText>

          <GradntHeading level={3} fontSize={19} lineHeight={23}>
            {goalLabel}
          </GradntHeading>

          <XStack alignItems="center" gap="$2">
            <GradntText weight="bold" fontSize={36} lineHeight={38} letterSpacing={-1.7}>
              {currentValue ?? '—'}
            </GradntText>

            <GradntText muted weight="semibold" fontSize={23} lineHeight={30} letterSpacing={-0.6}>
              {targetLabel}
            </GradntText>
          </XStack>
        </YStack>

        <GradntBadge tone="positive">{statusLabel}</GradntBadge>
      </XStack>

      {/* Zone réservée à l'artwork.
          Aucun rectangle, aucune bordure. */}
      <YStack zIndex={1} height={92} pointerEvents="none" />

      {/* FOOTER */}
      <YStack zIndex={2} gap="$3" marginTop="auto">
        <XStack alignItems="center" gap="$3">
          <YStack flex={1}>
            <GradntProgressBar value={progressPercentage} height={8} />
          </YStack>

          <GradntText weight="bold" fontSize={17} lineHeight={20}>
            {progressPercentage} %
          </GradntText>
        </XStack>

        <XStack alignItems="center" gap="$1">
          <GradntText color="$accentInk" weight="semibold" fontSize={13} lineHeight={17}>
            {changeLabel}
          </GradntText>

          <ArrowUpRight size={14} color="$accentInk" />
        </XStack>
      </YStack>
    </GradntCard>
  )
}
