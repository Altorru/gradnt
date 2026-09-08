import { Activity, ArrowUpRight, CalendarDays, TrendingUp } from '@tamagui/lucide-icons-2'
import { XStack, YStack } from 'tamagui'

import {
  GradntCard,
  GradntMiniBars,
  GradntProgressRing,
  GradntSparkline,
  GradntText,
} from '@/design-system'
import { useActivitiesQuery, useGoalQuery, useTrainingMetricsQuery } from '@/hooks/use-gradnt-data'
import {
  getActivityDataState,
  getDeterministicTrainingInsight,
  getGoalProgressPercentage,
  getRecentTrainingVolumeHours,
  getWeeklyRideCount,
} from '@/lib/domain'

import { AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

export function ProgressScreen() {
  const goalQuery = useGoalQuery()
  const metricsQuery = useTrainingMetricsQuery()
  const activitiesQuery = useActivitiesQuery()

  const activities = activitiesQuery.data ?? []
  const activityState = getActivityDataState(activities)
  const insight = getDeterministicTrainingInsight(activities, '3to6')
  const goalProgress = goalQuery.data ? getGoalProgressPercentage(goalQuery.data, 258) : 0
  const volumeHours = metricsQuery.data ? getRecentTrainingVolumeHours(metricsQuery.data) : 0
  const rideCount = getWeeklyRideCount(activities)
  const hasError = goalQuery.isError || metricsQuery.isError || activitiesQuery.isError

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
                  Objectif FTP
                </GradntText>
                <GradntText weight="bold" fontSize={28}>
                  258 → 280 W
                </GradntText>
                <XStack alignItems="center" gap="$1">
                  <ArrowUpRight size={15} color="$accent" />
                  <GradntText color="$accent" weight="semibold" fontSize={13}>
                    Valeur locale de démonstration
                  </GradntText>
                </XStack>
              </YStack>
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            <GradntCard padding="$4" gap="$4">
              <XStack alignItems="center" gap="$3">
                <Activity size={19} color="$accent" />
                <GradntText weight="semibold">Volume récent</GradntText>
              </XStack>
              <GradntText muted fontSize={13}>
                {metricsQuery.isPending
                  ? 'Chargement…'
                  : `${volumeHours} h de données ${activityState === 'mock' ? 'de démonstration' : activityState === 'observed' ? 'observées' : 'déclarées'}`}
              </GradntText>
              <GradntMiniBars data={[30, 42, 36, 56, 48, 62, 58]} width={250} height={62} gap={7} />
            </GradntCard>

            <GradntCard padding="$4" gap="$4">
              <XStack alignItems="center" gap="$3">
                <TrendingUp size={19} color="$accent" />
                <GradntText weight="semibold">Régularité</GradntText>
              </XStack>
              <GradntText muted fontSize={13}>
                {activitiesQuery.isPending
                  ? 'Chargement…'
                  : activityState === 'mock'
                    ? 'Données locales de démonstration'
                    : `${rideCount} sortie${rideCount > 1 ? 's' : ''} observée${rideCount > 1 ? 's' : ''}`}
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
