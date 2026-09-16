import { ChevronUp } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import { GradntBadge, GradntCard, GradntIconButton, GradntText } from '@/design-system'

import type { RouteWithScore } from '../domain'

import { formatDistance, formatElevation, recommendationLabels } from './route-format'

type RouteResultStripProps = {
  route: RouteWithScore
  /** How many proposals there are, so the strip can say what it is showing. */
  totalCount: number
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
export function RouteResultStrip({ route, totalCount, onOpenDetail }: RouteResultStripProps) {
  return (
    <GradntCard accent padding="$4" gap="$3">
      <XStack alignItems="flex-start" justifyContent="space-between" gap="$3">
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <GradntBadge
              tone={route.recommendationLabel === 'recommended' ? 'positive' : 'neutral'}
            >
              {recommendationLabels[route.recommendationLabel]}
            </GradntBadge>

            {totalCount > 1 ? (
              <GradntText muted fontSize={11}>
                {totalCount} propositions
              </GradntText>
            ) : null}
          </XStack>

          <GradntText weight="semibold" numberOfLines={1}>
            {route.name}
          </GradntText>

          <GradntText muted fontSize={13}>
            {formatDistance(route.distanceMeters)} · {formatElevation(route.elevationGainMeters)} ·
            score {route.score}/100
          </GradntText>
        </YStack>

        <GradntIconButton accessibilityLabel="Voir le détail du parcours" onPress={onOpenDetail}>
          <ChevronUp size={18} color="$textPrimary" />
        </GradntIconButton>
      </XStack>
    </GradntCard>
  )
}
