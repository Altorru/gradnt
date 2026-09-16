import { Activity, ArrowUpRight, CalendarDays, TrendingUp } from '@tamagui/lucide-icons-2'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'

import {
  GradntCard,
  GradntMiniBars,
  GradntProgressRing,
  GradntSparkline,
  GradntStravaConnectBlock,
  GradntText,
} from '@/design-system'
import { stravaService } from '@/features/onboarding/services/strava.service'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import {
  useActivitiesQuery,
  useAthleteQuery,
  useCurrentGoalValueQuery,
  useGoalQuery,
  useTrainingMetricsQuery,
} from '@/hooks/use-gradnt-data'
import {
  getActivityDataState,
  getDeterministicTrainingInsight,
  getGoalProgressPercentage,
  getRecentTrainingVolumeHours,
  getWeeklyRideCount,
  getWeeklyVolumeSeries,
} from '@/lib/domain'
import { describeActivityFailure } from '@/services/gradnt.repository'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

const goalLabels = {
  ftp: 'Objectif FTP',
  distance: 'Objectif distance',
  event: 'Objectif événement',
  climbing: 'Objectif dénivelé',
  fitness: 'Objectif forme',
} as const

const goalUnits = {
  w: 'W',
  km: 'km',
  m: 'm',
  none: '',
} as const

const volumeLabels = {
  lt3: '< 3 h',
  '3to6': '3–6 h',
  '6to10': '6–10 h',
  gt10: '10 h+',
} as const

export function ProgressScreen() {
  const setStrava = useOnboardingStore((state) => state.setStrava)
  const connected = useOnboardingStore((state) => state.strava?.status === 'connected')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const athleteQuery = useAthleteQuery()
  const goalQuery = useGoalQuery()
  const currentValueQuery = useCurrentGoalValueQuery()
  const metricsQuery = useTrainingMetricsQuery()
  const activitiesQuery = useActivitiesQuery()

  const activities = activitiesQuery.data ?? []
  const activityState = getActivityDataState(activities)
  const volumeSeries = getWeeklyVolumeSeries(activities)
  const declaredVolume = athleteQuery.data?.weeklyVolumeBand ?? '3to6'
  const insight = getDeterministicTrainingInsight(activities, declaredVolume)
  const goal = goalQuery.data
  const currentValue = currentValueQuery.data?.value ?? null
  const goalProgress = goal ? getGoalProgressPercentage(goal, currentValue) : 0
  const volumeHours = metricsQuery.data ? getRecentTrainingVolumeHours(metricsQuery.data) : 0
  const rideCount = getWeeklyRideCount(activities)
  const goalLabel = goal ? goalLabels[goal.type] : 'Objectif principal'
  const goalTarget = goal?.targetValue
  const goalUnit = goal ? goalUnits[goal.targetUnit] : ''
  const goalSummary =
    currentValue !== null && goalTarget !== null && goalTarget !== undefined
      ? `${currentValue} ${goalUnit} → ${goalTarget} ${goalUnit}`
      : 'Cible à préciser'
  const hasError =
    athleteQuery.isError ||
    goalQuery.isError ||
    currentValueQuery.isError ||
    metricsQuery.isError ||
    activitiesQuery.isError

  const connectStrava = async () => {
    setIsConnecting(true)
    setConnectError(null)

    const result = await stravaService.connect()

    if (result.ok) {
      setStrava(result.connection)
      await activitiesQuery.refetch()
    } else {
      setConnectError(result.error.message)
    }

    setIsConnecting(false)
  }

  // Every figure on this screen is computed from rides, so with no connection
  // there is genuinely nothing to report — and offering the way to change that
  // is more useful than a screen of zeroes.
  if (!connected) {
    return (
      <AppShell>
        <AppScrollView>
          <YStack gap="$7">
            <AppScreenIntro
              title="Ta progression"
              description="Les tendances utiles pour comprendre où tu en es, sans bruit inutile."
            />

            <GradntStravaConnectBlock
              onConnect={() => void connectStrava()}
              isConnecting={isConnecting}
              errorMessage={connectError}
            />
          </YStack>
        </AppScrollView>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro
            title="Ta progression"
            description="Les tendances utiles pour comprendre où tu en es, sans bruit inutile."
          />

          {hasError ? (
            <GradntText color="$danger" fontSize={13}>
              {activitiesQuery.isError
                ? describeActivityFailure(activitiesQuery.error)
                : 'Certaines données de progression sont momentanément indisponibles.'}
            </GradntText>
          ) : null}

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$4">
              <GradntProgressRing value={goalProgress} size={92} />
              <YStack flex={1} gap="$2">
                <GradntText muted fontSize={12}>
                  {goalLabel}
                </GradntText>
                <GradntText weight="bold" fontSize={28}>
                  {goalQuery.isPending || currentValueQuery.isPending ? '—' : goalSummary}
                </GradntText>
                <XStack alignItems="center" gap="$1">
                  <ArrowUpRight size={15} color="$accentInk" />
                  <GradntText color="$accentInk" weight="semibold" fontSize={13}>
                    {currentValueQuery.data?.provenance === 'observed'
                      ? 'Valeur issue de tes sorties'
                      : 'À préciser après tes premières sorties'}
                  </GradntText>
                </XStack>
              </YStack>
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            <GradntCard padding="$4" gap="$4">
              <XStack alignItems="center" gap="$3">
                <Activity size={19} color="$accentInk" />
                <GradntText weight="semibold">Volume récent</GradntText>
              </XStack>
              <GradntText muted fontSize={13}>
                {metricsQuery.isPending
                  ? 'Chargement…'
                  : `${volumeHours} h de données ${activityState === 'observed' ? 'observées' : `basées sur ton profil (${volumeLabels[declaredVolume]})`}`}
              </GradntText>
              <GradntMiniBars data={volumeSeries} width={250} height={62} gap={7} />
            </GradntCard>

            <GradntCard padding="$4" gap="$4">
              <XStack alignItems="center" gap="$3">
                <TrendingUp size={19} color="$accentInk" />
                <GradntText weight="semibold">Régularité</GradntText>
              </XStack>
              <GradntText muted fontSize={13}>
                {activitiesQuery.isPending
                  ? 'Chargement…'
                  : activityState === 'observed'
                    ? `${rideCount} sortie${rideCount > 1 ? 's' : ''} observée${rideCount > 1 ? 's' : ''}`
                    : 'Elle sera plus précise après tes premières sorties'}
              </GradntText>
              <GradntSparkline data={volumeSeries} width={250} height={62} />
            </GradntCard>
          </YStack>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={19} color="$recovery" />
              <GradntText weight="semibold">À retenir</GradntText>
            </XStack>
            <GradntText muted lineHeight={20}>
              {insight.message}
            </GradntText>
          </GradntCard>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
