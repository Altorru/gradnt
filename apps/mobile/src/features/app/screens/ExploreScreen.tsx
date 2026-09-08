import {
  ChevronRight,
  Clock3,
  Compass,
  Gauge,
  MapPin,
  Sparkles,
  TrendingUp,
} from '@tamagui/lucide-icons-2'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntChip,
  GradntHeading,
  GradntMetric,
  GradntSparkline,
  GradntText,
} from '@/design-system'
import { RouteMap } from '@/features/explore/components'
import { isRealRoutingConfigured, useRouteProposalsQuery } from '@/features/explore/hooks'
import {
  defaultRoutePreferences,
  type Route,
  type RouteMode,
  type RoutePreferences,
  type RouteWithScore,
  type TrainingIntent,
} from '@/features/explore/domain'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

const routeModes: { label: string; value: RouteMode }[] = [
  { label: 'Route', value: 'road' },
  { label: 'Gravel', value: 'gravel' },
  { label: 'VTT', value: 'mtb' },
]

const distanceOptions = [30, 60, 90]

const intentOptions: { label: string; value: TrainingIntent }[] = [
  { label: 'Endurance', value: 'endurance' },
  { label: 'Récupération', value: 'recovery' },
  { label: 'Dénivelé', value: 'climbing' },
  { label: 'Tempo', value: 'tempo' },
]

function formatDistance(distanceMeters: number) {
  return `${(distanceMeters / 1000).toFixed(1).replace('.', ',')} km`
}

function formatDuration(durationSeconds: number) {
  const minutes = Math.round(durationSeconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!hours) {
    return `${minutes} min`
  }

  return `${hours} h${remainingMinutes ? ` ${remainingMinutes} min` : ''}`
}

function formatTrafficLabel(label: Route['trafficExposure']['label']) {
  return label === 'low'
    ? 'Faible'
    : label === 'moderate'
      ? 'Modérée'
      : label === 'high'
        ? 'Élevée'
        : 'Inconnue'
}

function getRouteModeLabel(mode: RouteMode) {
  return mode === 'road' ? 'Route' : mode === 'gravel' ? 'Gravel' : 'VTT'
}

function getRecommendationLabel(label: RouteWithScore['recommendationLabel']) {
  return label === 'recommended'
    ? 'Recommandée'
    : label === 'quieter'
      ? 'Plus calme'
      : 'Plus entraînante'
}

function RouteProposalCard({
  route,
  selected,
  onPress,
}: {
  route: RouteWithScore
  selected: boolean
  onPress: () => void
}) {
  const elevationValues = route.elevationProfile.map((point) => point.elevationMeters)
  const mainSurface = route.surfaceBreakdown[0]

  return (
    <GradntCard accent={selected} padding="$4" gap="$4">
      <XStack alignItems="center" gap="$3">
        <YStack flex={1} gap="$1">
          <GradntBadge tone={route.recommendationLabel === 'recommended' ? 'positive' : 'neutral'}>
            {getRecommendationLabel(route.recommendationLabel)}
          </GradntBadge>
          <GradntHeading level={3}>{route.name}</GradntHeading>
          <GradntText muted fontSize={13}>
            {getRouteModeLabel(route.mode)} · score GRADNT {route.score}/100
          </GradntText>
        </YStack>
        <ChevronRight size={19} color="$textSecondary" />
      </XStack>

      <RouteMap route={route} />

      <XStack justifyContent="space-between" gap="$2">
        <GradntMetric label="Distance" value={formatDistance(route.distanceMeters)} />
        <GradntMetric label="Durée" value={formatDuration(route.durationSeconds)} />
      </XStack>

      <XStack gap="$4" flexWrap="wrap">
        <XStack alignItems="center" gap="$2">
          <TrendingUp size={16} color="$recovery" />
          <GradntText muted fontSize={13}>
            +{route.elevationGainMeters} m
          </GradntText>
        </XStack>
        <XStack alignItems="center" gap="$2">
          <Gauge size={16} color="$positive" />
          <GradntText muted fontSize={13}>
            Parcours {formatTrafficLabel(route.trafficExposure.label).toLowerCase()}
          </GradntText>
        </XStack>
        <GradntText muted fontSize={13}>
          {mainSurface?.percentage ?? 0}% {mainSurface?.label.toLowerCase() ?? 'surface'}
        </GradntText>
      </XStack>

      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <GradntText weight="semibold" fontSize={13}>
            Profil d&apos;altitude
          </GradntText>
          <GradntText muted fontSize={12}>
            {route.climbs.length} montée{route.climbs.length > 1 ? 's' : ''} détectée
            {route.climbs.length > 1 ? 's' : ''}
          </GradntText>
        </XStack>
        <GradntSparkline data={elevationValues} width={300} height={54} />
      </YStack>

      <XStack gap="$2" flexWrap="wrap">
        {route.surfaceBreakdown.map((surface) => (
          <GradntBadge key={`${route.id}-${surface.label}`} tone="neutral">
            {`${surface.label} ${surface.percentage}%`}
          </GradntBadge>
        ))}
      </XStack>

      <GradntButton
        tone={selected ? 'primary' : 'secondary'}
        iconAfter={<ChevronRight size={17} color={selected ? '$onAccent' : '$color'} />}
        onPress={onPress}
      >
        {selected ? 'Parcours sélectionné' : 'Choisir ce parcours'}
      </GradntButton>
    </GradntCard>
  )
}

export function ExploreScreen() {
  const [preferences, setPreferences] = useState<RoutePreferences>(defaultRoutePreferences)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const proposalsQuery = useRouteProposalsQuery(preferences)
  const proposals = proposalsQuery.data ?? []
  const usesRealRouting = isRealRoutingConfigured()

  function updatePreferences(update: Partial<RoutePreferences>) {
    setSelectedRouteId(null)
    setPreferences((current) => ({ ...current, ...update }))
  }

  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Explorer"
            description="Prépare une sortie qui correspond à ton objectif et à l’envie du jour."
          />

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <Compass size={21} color="$accent" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Trouver une sortie</GradntText>
                <GradntText muted fontSize={13}>
                  Trois idées classées selon ta distance, ton dénivelé et ton intention.
                </GradntText>
              </YStack>
            </XStack>

            <YStack gap="$2">
              <GradntText muted fontSize={12} weight="semibold">
                TYPE DE PARCOURS
              </GradntText>
              <XStack gap="$2" flexWrap="wrap">
                {routeModes.map((mode) => (
                  <GradntChoice
                    key={mode.value}
                    label={mode.label}
                    selected={preferences.mode === mode.value}
                    onPress={() => updatePreferences({ mode: mode.value })}
                  />
                ))}
              </XStack>
            </YStack>

            <YStack gap="$2">
              <GradntText muted fontSize={12} weight="semibold">
                DISTANCE CIBLE
              </GradntText>
              <XStack gap="$2">
                {distanceOptions.map((distance) => (
                  <GradntChip
                    key={distance}
                    label={`${distance} km`}
                    selected={preferences.targetDistanceKm === distance}
                    onPress={() => updatePreferences({ targetDistanceKm: distance })}
                  />
                ))}
              </XStack>
            </YStack>

            <YStack gap="$2">
              <GradntText muted fontSize={12} weight="semibold">
                INTENTION
              </GradntText>
              <XStack gap="$2" flexWrap="wrap">
                {intentOptions.map((intent) => (
                  <GradntChip
                    key={intent.value}
                    label={intent.label}
                    selected={preferences.trainingIntent === intent.value}
                    onPress={() => updatePreferences({ trainingIntent: intent.value })}
                  />
                ))}
              </XStack>
            </YStack>
          </GradntCard>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <MapPin size={19} color="$recovery" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Départ local</GradntText>
                <GradntText muted fontSize={13}>
                  {usesRealRouting
                    ? 'Parcours calculés par HeiGIT depuis un départ local.'
                    : 'Les propositions actuelles sont des données de démonstration autour de Lyon.'}
                </GradntText>
              </YStack>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <GradntChip
                label="Parcours plus calme"
                selected={preferences.lowTraffic}
                onPress={() => updatePreferences({ lowTraffic: !preferences.lowTraffic })}
              />
              <GradntText muted fontSize={12}>
                L’exposition routière est une estimation, pas un niveau de sécurité.
              </GradntText>
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Sparkles size={19} color="$accent" />
              <GradntHeading level={2}>Tes propositions</GradntHeading>
            </XStack>
            <GradntText muted fontSize={13}>
              Score déterministe basé sur la compatibilité avec ta demande.{' '}
              {usesRealRouting
                ? 'La géométrie vient de HeiGIT et les métadonnées sont normalisées par GRADNT.'
                : 'Les coordonnées réelles seront fournies par HeiGIT sur une build native configurée.'}
            </GradntText>

            {proposalsQuery.isPending ? (
              <GradntCard padding="$4">
                <GradntText muted>Recherche de parcours…</GradntText>
              </GradntCard>
            ) : null}

            {proposalsQuery.isError ? (
              <GradntCard padding="$4" gap="$3">
                <GradntText color="$danger" weight="semibold">
                  Impossible de charger les parcours.
                </GradntText>
                <GradntText muted fontSize={13}>
                  Vérifie ta connexion puis réessaie. Aucun parcours n&apos;est inventé lorsque le
                  moteur de routing est indisponible.
                </GradntText>
                <GradntButton tone="secondary" onPress={() => void proposalsQuery.refetch()}>
                  Réessayer
                </GradntButton>
              </GradntCard>
            ) : null}

            {!proposalsQuery.isPending && !proposalsQuery.isError && proposals.length === 0 ? (
              <GradntCard padding="$4">
                <GradntText muted>
                  Aucun parcours ne correspond encore à ces préférences.
                </GradntText>
              </GradntCard>
            ) : null}

            {proposals.map((route) => (
              <RouteProposalCard
                key={route.id}
                route={route}
                selected={route.id === selectedRouteId}
                onPress={() => setSelectedRouteId(route.id)}
              />
            ))}
          </YStack>

          <XStack alignItems="center" gap="$2">
            <Clock3 size={16} color="$textSecondary" />
            <GradntText muted fontSize={12}>
              Les durées sont estimées. Adapte toujours ta sortie aux conditions réelles.
            </GradntText>
          </XStack>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}

function GradntChoice({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <GradntButton
      tone={selected ? 'primary' : 'secondary'}
      minHeight={42}
      paddingHorizontal="$3"
      onPress={onPress}
    >
      {label}
    </GradntButton>
  )
}
