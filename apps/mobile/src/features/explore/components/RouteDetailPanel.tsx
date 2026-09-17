import { ChevronUp, Info, Mountain, Route as RouteIcon, TrendingUp } from '@tamagui/lucide-icons-2'
import { line } from 'd3-shape'
import Svg, { Path } from 'react-native-svg'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntProgressBar,
  GradntText,
} from '@/design-system'
import { colors } from '@/design-system/tokens'
import { useTranslation, type MessageKey } from '@/i18n'

import { RouteMap } from './RouteMap'
import type { RouteWithScore, SurfaceGroupCode, WayTypeCode } from '../domain'

/** Where each exposure level's word lives. */
const EXPOSURE_KEYS: Record<RouteWithScore['trafficExposure']['label'], MessageKey> = {
  low: 'explore.exposureLevels.low',
  moderate: 'explore.exposureLevels.moderate',
  high: 'explore.exposureLevels.high',
  unknown: 'explore.exposureLevels.low',
}

function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`
}

type ChartPoint = {
  x: number
  y: number
}

function ElevationProfile({ route }: { route: RouteWithScore }) {
  const { t } = useTranslation()
  const width = 320
  const height = 110
  const padding = 8
  const distances = route.elevationProfile.map((point) => point.distanceMeters)
  const elevations = route.elevationProfile.map((point) => point.elevationMeters)
  const minDistance = Math.min(...distances)
  const maxDistance = Math.max(...distances) || 1
  const minElevation = Math.min(...elevations)
  const maxElevation = Math.max(...elevations)
  const elevationRange = maxElevation - minElevation || 1

  const chartPoints: ChartPoint[] = route.elevationProfile.map((point) => ({
    x: padding + ((point.distanceMeters - minDistance) / maxDistance) * (width - padding * 2),
    y:
      height -
      padding -
      ((point.elevationMeters - minElevation) / elevationRange) * (height - padding * 2),
  }))
  const elevationPath = line<ChartPoint>()
    .x((point) => point.x)
    .y((point) => point.y)(chartPoints)

  const climbPaths = route.climbs.map((climb) => {
    const climbPoints = route.elevationProfile
      .map((point, index) => ({ point, index }))
      .filter(
        ({ point }) =>
          point.distanceMeters >= climb.startDistanceMeters &&
          point.distanceMeters <= climb.endDistanceMeters,
      )
      .map(({ point }) => ({
        x: padding + ((point.distanceMeters - minDistance) / maxDistance) * (width - padding * 2),
        y:
          height -
          padding -
          ((point.elevationMeters - minElevation) / elevationRange) * (height - padding * 2),
      }))

    return climbPoints.length >= 2 ? line<ChartPoint>()(climbPoints) : null
  })

  return (
    <YStack gap="$2">
      <XStack justifyContent="space-between" alignItems="center">
        <GradntText weight="semibold" fontSize={13}>
          {t('explore.detail.elevationProfile')}
        </GradntText>
        <GradntText muted fontSize={12}>
          {t('explore.detail.elevationLegend')}
        </GradntText>
      </XStack>
      <YStack backgroundColor="$backgroundSubtle" borderRadius="$3" padding="$2">
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {elevationPath ? (
            <Path
              d={elevationPath}
              fill="none"
              stroke={colors.alpine}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {climbPaths.map((climbPath, index) =>
            climbPath ? (
              <Path
                key={`${route.id}-climb-profile-${index}`}
                d={climbPath}
                fill="none"
                stroke={colors.orange}
                strokeWidth={4.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null,
          )}
        </Svg>
      </YStack>
    </YStack>
  )
}

/**
 * Where each way type's word lives.
 *
 * The engine and the exposure score both work in codes and the words are looked
 * up here, at the edge, where the translator is — a label in the domain is a
 * label something will eventually compare as identity.
 */
const WAY_TYPE_KEYS: Record<WayTypeCode, MessageKey> = {
  unknown: 'explore.wayTypes.unknown',
  primary: 'explore.wayTypes.primary',
  secondary: 'explore.wayTypes.secondary',
  street: 'explore.wayTypes.street',
  path: 'explore.wayTypes.path',
  track: 'explore.wayTypes.track',
  cycleway: 'explore.wayTypes.cycleway',
  footway: 'explore.wayTypes.footway',
  steps: 'explore.wayTypes.steps',
  ferry: 'explore.wayTypes.ferry',
  construction: 'explore.wayTypes.construction',
}

/** And each surface group's. */
const SURFACE_GROUP_KEYS: Record<SurfaceGroupCode, MessageKey> = {
  paved: 'explore.surfaceGroups.paved',
  compacted: 'explore.surfaceGroups.compacted',
  gravel: 'explore.surfaceGroups.gravel',
  trail: 'explore.surfaceGroups.trail',
  unknown: 'explore.surfaceGroups.unknown',
}

function BreakdownList({
  title,
  items,
  keys,
}: {
  title: string
  items: RouteWithScore['surfaceBreakdown']
  /** The vocabulary these items are drawn from: `unknown` is a different word in each. */
  keys: Record<string, MessageKey>
}) {
  const { t } = useTranslation()

  return (
    <YStack gap="$3">
      <GradntText weight="semibold" fontSize={13}>
        {title}
      </GradntText>
      {items.map((item) => (
        <YStack key={`${title}-${item.code}`} gap="$1">
          <XStack justifyContent="space-between" gap="$2">
            <GradntText fontSize={13}>{t(keys[item.code] ?? keys.unknown)}</GradntText>
            <GradntText muted fontSize={12}>
              {item.percentage}% · {formatDistance(item.distanceMeters)}
            </GradntText>
          </XStack>
          <GradntProgressBar value={item.percentage} height={7} />
        </YStack>
      ))}
    </YStack>
  )
}

export function RouteDetailPanel({
  route,
  onClose,
}: {
  route: RouteWithScore
  onClose: () => void
}) {
  const { t, plural } = useTranslation()
  return (
    <GradntCard accent padding="$4" gap="$5">
      <XStack alignItems="center" gap="$3">
        <YStack flex={1} gap="$1">
          <GradntBadge tone="positive">{t('explore.detail.title')}</GradntBadge>
          <GradntHeading level={2}>{route.name}</GradntHeading>
          <GradntText muted fontSize={13}>
            {t('explore.detail.geometry')}
          </GradntText>
        </YStack>
        <ChevronUp size={20} color="$accentInk" />
      </XStack>

      <RouteMap route={route} />

      <XStack gap="$3" flexWrap="wrap">
        <XStack alignItems="center" gap="$2">
          <TrendingUp size={16} color="$recovery" />
          <GradntText muted fontSize={13}>
            {t('explore.detail.elevationGain', { value: route.elevationGainMeters })}
          </GradntText>
        </XStack>
        <XStack alignItems="center" gap="$2">
          <Mountain size={16} color="$warning" />
          <GradntText muted fontSize={13}>
            {plural('explore.detail.climbs', route.climbs.length)}
          </GradntText>
        </XStack>
        <XStack alignItems="center" gap="$2">
          <Info size={16} color="$recovery" />
          <GradntText muted fontSize={13}>
            {t('explore.detail.exposure', { level: t(EXPOSURE_KEYS[route.trafficExposure.label]) })}
          </GradntText>
        </XStack>
      </XStack>

      <ElevationProfile route={route} />

      <YStack gap="$3">
        <XStack alignItems="center" gap="$2">
          <Mountain size={17} color="$warning" />
          <GradntText weight="semibold" fontSize={13}>
            {t('explore.detail.detectedClimbs')}
          </GradntText>
        </XStack>
        {route.climbs.length ? (
          route.climbs.map((climb) => (
            <XStack key={climb.id} justifyContent="space-between" gap="$3">
              <YStack flex={1} gap="$1">
                <GradntText fontSize={13} weight="semibold">
                  {formatDistance(climb.lengthMeters)} · +{climb.elevationGainMeters} m
                </GradntText>
                <GradntText muted fontSize={12}>
                  {t('explore.detail.climbRange', {
                    start: (climb.startDistanceMeters / 1000).toFixed(1),
                    end: (climb.endDistanceMeters / 1000).toFixed(1),
                    score: climb.difficultyScore,
                  })}
                </GradntText>
              </YStack>
              <GradntText color="$warning" fontSize={13} weight="semibold">
                {t('explore.detail.climbGradients', {
                  average: climb.averageGradientPercent,
                  maximum: climb.maximumGradientPercent,
                })}
              </GradntText>
            </XStack>
          ))
        ) : (
          <GradntText muted fontSize={13}>
            {t('explore.detail.noClimbs')}
          </GradntText>
        )}
      </YStack>

      <BreakdownList
        title={t('explore.detail.surfaces')}
        items={route.surfaceBreakdown}
        keys={SURFACE_GROUP_KEYS}
      />
      <BreakdownList
        title={t('explore.detail.wayTypes')}
        items={route.wayTypeBreakdown}
        keys={WAY_TYPE_KEYS}
      />

      <GradntCard padding="$3" backgroundColor="$backgroundSubtle" gap="$2">
        <XStack alignItems="center" gap="$2">
          <RouteIcon size={17} color="$recovery" />
          <GradntText weight="semibold" fontSize={13}>
            {t('explore.detail.roadEnvironment')}
          </GradntText>
        </XStack>
        <GradntText muted fontSize={13} lineHeight={19}>
          {t(`explore.detail.exposureRationale.${route.trafficExposure.rationaleCode}`)}{' '}
          {t('explore.detail.exposureCaveat')}
        </GradntText>
      </GradntCard>

      <GradntCard padding="$3" backgroundColor="$backgroundSubtle" gap="$2">
        <GradntText weight="semibold" fontSize={13}>
          {t('explore.detail.sessionFit')}
        </GradntText>
        <XStack justifyContent="space-between">
          <GradntText muted fontSize={13}>
            {t('explore.detail.intention', { intent: route.trainingIntent })}
          </GradntText>
          <GradntText color="$positive" weight="semibold" fontSize={13}>
            {route.trainingIntentFit}/100
          </GradntText>
        </XStack>
        <GradntText muted fontSize={12}>
          {t('explore.detail.fitNote')}
        </GradntText>
      </GradntCard>

      <GradntButton
        tone="secondary"
        iconAfter={<ChevronUp size={17} color="$color" />}
        onPress={onClose}
      >
        {t('explore.detail.collapse')}
      </GradntButton>
    </GradntCard>
  )
}
