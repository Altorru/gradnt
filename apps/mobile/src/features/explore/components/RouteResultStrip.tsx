import { ChevronUp } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntBadge, GradntCard, GradntChip, GradntIconButton, GradntText } from '@/design-system'

import type { RouteWithScore } from '../domain'

import { useTranslation } from '@/i18n'

import { formatDistance, formatElevation, recommendationLabels } from './route-format'

type RouteResultStripProps = {
  route: RouteWithScore
  /** Every proposal, so the rider can switch without going back to the map. */
  alternatives: RouteWithScore[]
  onSelect: (routeId: string) => void
  onOpenDetail: () => void
}

/**
 * The one route worth showing, at the foot of the map.
 *
 * Three stacked cards became one. On a screen whose subject is the map, choosing
 * means seeing the line and reading one summary — three blocks of text pushed
 * the map into a strip of its own.
 *
 * It shows the selected route, or the best one while nothing is selected, and
 * says how many alternatives there are so the rider knows there is a choice.
 */
export function RouteResultStrip({
  route,
  alternatives,
  onSelect,
  onOpenDetail,
}: RouteResultStripProps) {
  const { t } = useTranslation()

  return (
    <GradntCard accent padding="$4" gap="$3">
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <GradntBadge
              tone={route.recommendationLabel === 'recommended' ? 'positive' : 'neutral'}
            >
              {recommendationLabels(t)[route.recommendationLabel]}
            </GradntBadge>
          </XStack>

          <GradntText weight="semibold" numberOfLines={1}>
            {route.name}
          </GradntText>

          <GradntText muted fontSize={13}>
            {formatDistance(route.distanceMeters)} · {formatElevation(route.elevationGainMeters)} ·
            {t('explore.detail.score', { score: route.score })}
          </GradntText>
        </YStack>

        <GradntIconButton accessibilityLabel={t('explore.strip.seeDetail')} onPress={onOpenDetail}>
          <ChevronUp size={18} color="$textPrimary" />
        </GradntIconButton>
      </XStack>

      {/* The map draws every proposal, so there has to be a way to pick one
          without touching the lines themselves — a line is a thin target on a
          busy map, and picking between three overlapping loops by finger is a
          worse job than picking between three labels. */}
      {alternatives.length > 1 ? (
        <XStack gap="$2" flexWrap="wrap">
          {alternatives.map((candidate, index) => (
            <GradntChip
              key={candidate.id}
              label={`${index + 1}`}
              selected={candidate.id === route.id}
              onPress={() => onSelect(candidate.id)}
            />
          ))}
        </XStack>
      ) : null}
    </GradntCard>
  )
}
