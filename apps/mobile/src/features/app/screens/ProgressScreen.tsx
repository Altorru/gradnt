import { Activity, ArrowUpRight, CalendarDays, TrendingUp } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import {
  GradntCard,
  GradntMiniBars,
  GradntProgressRing,
  GradntSparkline,
  GradntText,
} from '@/design-system'
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
} from '@/lib/domain'

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
  const athleteQuery = useAthleteQuery()
  const goalQuery = useGoalQuery()
  const currentValueQuery = useCurrentGoalValueQuery()
  const metricsQuery = useTrainingMetricsQuery()
  const activitiesQuery = useActivitiesQuery()

  const activities = activitiesQuery.data ?? []
  const activityState = getActivityDataState(activities)
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
              Certaines données de progression sont momentanément indisponibles.
            </GradntText>
          ) : null}

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$4">
              <GradntProgressRing value={goalProgress || 78} size={92} />
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
                    {currentValueQuery.data?.provenance === 'mock'
                      ? 'Valeur locale de démonstration'
                      : 'Valeur issue des données disponibles'}
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
                  : `${volumeHours} h de données ${activityState === 'mock' ? 'de démonstration' : activityState === 'observed' ? 'observées' : `basées sur ton profil (${volumeLabels[declaredVolume]})`}`}
              </GradntText>
              <GradntMiniBars data={[30, 42, 36, 56, 48, 62, 58]} width={250} height={62} gap={7} />
            </GradntCard>

            <GradntCard padding="$4" gap="$4">
              <XStack alignItems="center" gap="$3">
                <TrendingUp size={19} color="$accentInk" />
                <GradntText weight="semibold">Régularité</GradntText>
              </XStack>
              <GradntText muted fontSize={13}>
                {activitiesQuery.isPending
                  ? 'Chargement…'
                  : activityState === 'mock'
                    ? 'Données locales de démonstration'
                    : activityState === 'observed'
                      ? `${rideCount} sortie${rideCount > 1 ? 's' : ''} observée${rideCount > 1 ? 's' : ''}`
                      : 'Elle sera plus précise après tes premières sorties'}
              </GradntText>
              <GradntSparkline data={[30, 38, 33, 52, 58, 50, 68, 76]} width={250} height={62} />
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
