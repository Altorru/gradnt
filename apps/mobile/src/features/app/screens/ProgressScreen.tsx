import { OnboardingSaveFeedback } from '@/features/onboarding/components/OnboardingSaveFeedback'
import { ArrowUpRight, CalendarDays } from '@tamagui/lucide-icons-2'
import { format as formatDate } from 'date-fns'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'

import {
  GradntCard,
  GradntChartCard,
  GradntProgressRing,
  GradntStravaConnectBlock,
  GradntText,
} from '@/design-system'
import { useDateLocale, useTranslation, type MessageKey } from '@/i18n'
import { STRAVA_ERROR_KEYS } from '@/features/onboarding/domain/strava.schema'
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
  getWeekWindow,
  getWeeklyRideCountSeries,
  getWeeklyVolumeSeries,
} from '@/lib/domain'
import { describeActivityFailure } from '@/services/gradnt.repository'

import { AppBrandHeader, AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'
import { goalUnitSymbol } from '../domain/goal-labels'

/**
 * The goal words and the volume bands are the onboarding ones.
 *
 * They were copied here, which is a word waiting to drift from the step where
 * the rider chose it.
 */
const GOAL_KEYS: Record<string, MessageKey> = {
  ftp: 'onboarding.goalLabels.ftp',
  distance: 'onboarding.goalLabels.distance',
  event: 'onboarding.goalLabels.event',
  climbing: 'onboarding.goalLabels.climbing',
  fitness: 'onboarding.goalLabels.fitness',
}

const VOLUME_KEYS: Record<string, MessageKey> = {
  lt3: 'onboarding.volumes.lt3',
  '3to6': 'onboarding.volumes.threeToSix',
  '6to10': 'onboarding.volumes.sixToTen',
  gt10: 'onboarding.volumes.gt10',
}

export function ProgressScreen() {
  const { t, plural } = useTranslation()
  const dateLocale = useDateLocale()
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
  const rideSeries = getWeeklyRideCountSeries(activities)

  /**
   * Names the seven days a point covers.
   *
   * The buckets are rolling windows counted back from now, not calendar weeks,
   * so this says the dates rather than naming a week — which would claim an
   * alignment the data does not have.
   */
  const windowLabel = (index: number) => {
    if (index === volumeSeries.length - 1) {
      return t('progress.lastSevenDays')
    }

    const { start, end } = getWeekWindow(index, volumeSeries.length)

    return `${formatDate(start, 'd MMM', { locale: dateLocale })} – ${formatDate(end, 'd MMM', { locale: dateLocale })}`
  }
  const declaredVolume = athleteQuery.data?.weeklyVolumeBand ?? '3to6'
  const insight = getDeterministicTrainingInsight(activities, declaredVolume, { t, plural })
  const goal = goalQuery.data
  const currentValue = currentValueQuery.data?.value ?? null
  const goalProgress = goal ? getGoalProgressPercentage(goal, currentValue) : 0
  const volumeHours = metricsQuery.data ? getRecentTrainingVolumeHours(metricsQuery.data) : 0
  const rideCount = getWeeklyRideCount(activities)
  const goalLabel = goal ? t(GOAL_KEYS[goal.type] ?? 'progress.mainGoal') : t('progress.mainGoal')
  const goalTarget = goal?.targetValue
  const goalUnit = goal ? goalUnitSymbol(goal.targetUnit) : ''
  const goalSummary =
    currentValue !== null && goalTarget !== null && goalTarget !== undefined
      ? `${currentValue} ${goalUnit} → ${goalTarget} ${goalUnit}`
      : t('progress.targetToSet')
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
      await setStrava(result.connection)
      await activitiesQuery.refetch()
    } else {
      setConnectError(t(STRAVA_ERROR_KEYS[result.error.code], result.error.params))
    }

    setIsConnecting(false)
  }

  // Every figure on this screen is computed from rides, so with no connection
  // there is genuinely nothing to report — and offering the way to change that
  // is more useful than a screen of zeroes.
  if (!connected) {
    return (
      <AppShell header={<AppBrandHeader />}>
        <AppScrollView>
          <YStack gap="$7">
            <OnboardingSaveFeedback />
            <AppScreenIntro title={t('progress.title')} description={t('progress.description')} />

            <GradntStravaConnectBlock
              onConnect={() => void connectStrava()}
              isConnecting={isConnecting}
              errorMessage={connectError}
              title={t('onboarding.strava.title')}
              description={t('settings.strava.connectNote')}
              connectLabel={t('settings.strava.connect')}
              connectingLabel={t('settings.strava.connecting')}
            />
          </YStack>
        </AppScrollView>
      </AppShell>
    )
  }

  return (
    <AppShell header={<AppBrandHeader />}>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro title={t('progress.title')} description={t('progress.description')} />

          {hasError ? (
            <GradntText color="$danger" fontSize={13}>
              {activitiesQuery.isError
                ? describeActivityFailure(activitiesQuery.error, t)
                : t('progress.unavailable')}
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
                      ? t('progress.fromYourRides')
                      : t('progress.toSetAfterFirstRides')}
                  </GradntText>
                </XStack>
              </YStack>
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            <GradntChartCard
              title={t('progress.recentVolume')}
              unit="h"
              data={volumeSeries}
              secondary={{ data: rideSeries, unit: t('progress.ridesUnit') }}
              windowLabel={windowLabel}
              spanLabel={t('progress.spanWeeks', { weeks: volumeSeries.length })}
              todayLabel={t('progress.today')}
              closeHintLabel={t('progress.tapAgainToClose')}
              description={
                metricsQuery.isPending
                  ? t('common.loading')
                  : activityState === 'observed'
                    ? t('progress.observedData', { hours: volumeHours })
                    : t('progress.profileData', {
                        hours: volumeHours,
                        band: t(VOLUME_KEYS[declaredVolume] ?? 'onboarding.volumes.threeToSix'),
                      })
              }
            />

            {/* Ride counts, not hours. The card speaks about regularity, and it
                was drawing the same series as the volume card above it — the
                same shape, twice, presented as two insights. */}
            <GradntChartCard
              title={t('progress.regularity')}
              unit={t('progress.ridesUnit')}
              variant="line"
              data={rideSeries}
              secondary={{ data: volumeSeries, unit: 'h' }}
              windowLabel={windowLabel}
              spanLabel={t('progress.spanWeeks', { weeks: rideSeries.length })}
              todayLabel={t('progress.today')}
              closeHintLabel={t('progress.tapAgainToClose')}
              description={
                activitiesQuery.isPending
                  ? t('common.loading')
                  : activityState === 'observed'
                    ? plural('progress.ridesThisWeek', rideCount)
                    : t('progress.morePreciseLater')
              }
            />
          </YStack>

          <GradntCard padding="$4" gap="$3">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={19} color="$recovery" />
              <GradntText weight="semibold">{t('progress.takeaway')}</GradntText>
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
