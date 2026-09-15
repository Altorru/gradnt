import { ChevronRight, Clock3, Compass, Gauge, MapPin, Sparkles } from '@tamagui/lucide-icons-2'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntChip,
  GradntHeading,
  GradntMetric,
  GradntText,
} from '@/design-system'
import { RouteDetailPanel } from '@/features/explore/components'
import { useCurrentRouteStart, useRouteProposalsQuery } from '@/features/explore/hooks'
import {
  defaultRoutePreferences,
  type Route,
  type RouteMode,
  type RoutePreferences,
  type RouteWithScore,
  type SurfacePreference,
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
const elevationOptions = [200, 500, 800]

const surfaceOptions: { label: string; value: SurfacePreference }[] = [
  { label: 'Asphalte', value: 'paved' },
  { label: 'Mixte', value: 'mixed' },
  { label: 'Gravier', value: 'gravel' },
  { label: 'Sentier', value: 'trail' },
]

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

function formatExposureLabel(label: Route['trafficExposure']['label']) {
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
      : label === 'training'
        ? 'Plus entraînante'
        : 'Alternative'
}

function getTrainingFitLabel(score: number) {
  return score >= 85 ? 'Très adaptée' : score >= 70 ? 'Adaptée' : 'À ajuster'
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

      <XStack justifyContent="space-between" gap="$3">
        <GradntMetric label="Distance" value={formatDistance(route.distanceMeters)} />
        <GradntMetric label="Durée" value={formatDuration(route.durationSeconds)} />
        <GradntMetric label="Dénivelé" value={`+${route.elevationGainMeters} m`} />
      </XStack>

      <XStack gap="$3" flexWrap="wrap">
        <XStack alignItems="center" gap="$2">
          <Gauge size={16} color="$positive" />
          <GradntText muted fontSize={13}>
            Route {formatExposureLabel(route.trafficExposure.label).toLowerCase()}
          </GradntText>
        </XStack>
        <GradntText muted fontSize={13}>
          {mainSurface?.percentage ?? 0}% {mainSurface?.label.toLowerCase() ?? 'surface'}
        </GradntText>
        <GradntText muted fontSize={13}>
          Séance {getTrainingFitLabel(route.trainingIntentFit).toLowerCase()}
        </GradntText>
      </XStack>

      <GradntButton
        tone={selected ? 'primary' : 'secondary'}
        iconAfter={<ChevronRight size={17} color={selected ? '$onAccent' : '$color'} />}
        onPress={onPress}
      >
        {selected ? 'Détail ouvert' : 'Voir le détail'}
      </GradntButton>
    </GradntCard>
  )
}

export function ExploreScreen() {
  const [preferences, setPreferences] = useState<RoutePreferences>(defaultRoutePreferences)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const routeStart = useCurrentRouteStart()
  const proposalsQuery = useRouteProposalsQuery(preferences, routeStart.start)
  const proposals = proposalsQuery.data ?? []
  const selectedRoute = proposals.find((route) => route.id === selectedRouteId)
  const usesRealRouting = proposals.some((route) => route.provider.name === 'openrouteservice')

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
              <Compass size={21} color="$accentInk" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Trouver une sortie</GradntText>
                <GradntText muted fontSize={13}>
                  Trois idées classées selon ta distance, ton dénivelé et ton intention.
                </GradntText>
              </YStack>
            </XStack>

            <PreferenceGroup label="TYPE DE PARCOURS">
              {routeModes.map((mode) => (
                <GradntChip
                  key={mode.value}
                  label={mode.label}
                  selected={preferences.mode === mode.value}
                  onPress={() => updatePreferences({ mode: mode.value })}
                />
              ))}
            </PreferenceGroup>

            <PreferenceGroup label="DISTANCE CIBLE">
              {distanceOptions.map((distance) => (
                <GradntChip
                  key={distance}
                  label={`${distance} km`}
                  selected={preferences.targetDistanceKm === distance}
                  onPress={() => updatePreferences({ targetDistanceKm: distance })}
                />
              ))}
            </PreferenceGroup>

            <PreferenceGroup label="DÉNIVELÉ CIBLE">
              {elevationOptions.map((elevation) => (
                <GradntChip
                  key={elevation}
                  label={`+${elevation} m`}
                  selected={preferences.targetElevationGainMeters === elevation}
                  onPress={() => updatePreferences({ targetElevationGainMeters: elevation })}
                />
              ))}
            </PreferenceGroup>

            <PreferenceGroup label="SURFACE">
              {surfaceOptions.map((surface) => (
                <GradntChip
                  key={surface.value}
                  label={surface.label}
                  selected={preferences.surfacePreference === surface.value}
                  onPress={() => updatePreferences({ surfacePreference: surface.value })}
                />
              ))}
            </PreferenceGroup>

            <PreferenceGroup label="INTENTION DE SÉANCE">
              {intentOptions.map((intent) => (
                <GradntChip
                  key={intent.value}
                  label={intent.label}
                  selected={preferences.trainingIntent === intent.value}
                  onPress={() =>
                    updatePreferences({
                      trainingIntent: intent.value,
                      plannedWorkoutIntent: intent.value,
                    })
                  }
                />
              ))}
            </PreferenceGroup>
          </GradntCard>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <MapPin size={19} color="$recovery" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Départ local</GradntText>
                <GradntText muted fontSize={13}>
                  {usesRealRouting
                    ? 'Parcours calculés par HeiGIT depuis le départ configuré.'
                    : 'Les propositions actuelles sont des données de démonstration autour de Lyon.'}
                </GradntText>
              </YStack>
            </XStack>
            <XStack alignItems="center" gap="$2" flexWrap="wrap">
              <GradntChip
                label="Parcours plus calme"
                selected={preferences.lowTraffic}
                onPress={() => updatePreferences({ lowTraffic: !preferences.lowTraffic })}
              />
              <GradntButton
                tone="secondary"
                haptic={false}
                disabled={routeStart.isRequesting}
                onPress={() => void routeStart.requestCurrentLocation()}
              >
                {routeStart.isRequesting
                  ? 'Localisation…'
                  : routeStart.isDefaultStart
                    ? 'Utiliser ma position'
                    : 'Position actuelle utilisée'}
              </GradntButton>
            </XStack>
            <GradntText muted fontSize={12}>
              {routeStart.error ??
                (routeStart.isDefaultStart
                  ? 'Départ de démonstration à Lyon. La position réelle est demandée uniquement à ton action.'
                  : 'Les parcours partent de ta position actuelle.')}
            </GradntText>
          </GradntCard>

          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Sparkles size={19} color="$accentInk" />
              <GradntHeading level={2}>Tes propositions</GradntHeading>
            </XStack>
            <GradntText muted fontSize={13}>
              Le score GRADNT combine distance, relief, surface, discipline, calme des voies et
              intention d&apos;entraînement.
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
                <GradntText muted>Aucun parcours ne correspond à ces préférences.</GradntText>
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

          {selectedRoute ? (
            <RouteDetailPanel route={selectedRoute} onClose={() => setSelectedRouteId(null)} />
          ) : null}

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

function PreferenceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <YStack gap="$2">
      <GradntText muted fontSize={12} weight="semibold">
        {label}
      </GradntText>
      <XStack gap="$2" flexWrap="wrap">
        {children}
      </XStack>
    </YStack>
  )
}
