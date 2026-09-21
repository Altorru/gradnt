import { AfterRidePrompt } from '@/features/rides/components/AfterRidePrompt'
import { getAfterRideActivity } from '@/features/rides/domain/after-ride'
import { OnboardingSaveFeedback } from '@/features/onboarding/components/OnboardingSaveFeedback'
import { format as formatDate } from 'date-fns'
import { useRouter, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  GradntCard,
  GradntButton,
  GradntGoalCard,
  GradntHeading,
  GradntProgressBar,
  GradntIntensityBreakdown,
  GradntSectionHeader,
  GradntStatTile,
  GradntStravaConnectBlock,
  GradntText,
  GradntWorkoutCard,
} from '@/design-system'
import {
  useActivitiesQuery,
  useAthleteQuery,
  useCurrentGoalValueQuery,
  useGoalQuery,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'
import { describeActivityFailure } from '@/services/gradnt.repository'
import {
  getActivityDataState,
  getDeterministicCoachDecision,
  getDeterministicTrainingInsight,
  getGoalProgressPercentage,
  getIntensityDistribution,
  getCurrentWeekWorkouts,
  getPlanCompletionPercentage,
  getNextWorkout,
  getWeeklyDistanceSeries,
  getWeeklyRideCountSeries,
  getWeeklyVolumeSeries,
  getWindowDelta,
} from '@/lib/domain'
import { XStack, YStack } from 'tamagui'

import { AppBrandHeader } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'
import { formatWorkoutDuration, workoutIntensity, workoutTitle } from '../domain/workout-labels'
import { goalEyebrow, goalTargetLabel, goalTypeLabel } from '../domain/goal-labels'
import { useDateLocale, useTranslation } from '@/i18n'
import { STRAVA_ERROR_KEYS } from '@/features/onboarding/domain/strava.schema'
import { stravaService } from '@/features/onboarding/services/strava.service'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import type { FtpEntry } from '@/services/ftp/ftp.persistence'
import { loadFtpHistory } from '@/services/ftp/ftp.service'
import { reconcileStoredStravaConnection } from '@/services/strava/strava-connection.service'

export function HomeScreen() {
  const { t, plural } = useTranslation()
  const dateLocale = useDateLocale()
  const router = useRouter()
  const setStrava = useOnboardingStore((state) => state.setStrava)
  const connected = useOnboardingStore((state) => state.strava?.status === 'connected')
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [ftpHistory, setFtpHistory] = useState<FtpEntry[]>([])
  const athleteQuery = useAthleteQuery()
  const activitiesQuery = useActivitiesQuery()
  const goalQuery = useGoalQuery()
  const currentValueQuery = useCurrentGoalValueQuery()
  const workoutsQuery = useUpcomingWorkoutsQuery()

  const goal = goalQuery.data
  const currentGoalValue = currentValueQuery.data?.value ?? null
  const nextWorkout = getNextWorkout(workoutsQuery.data ?? [])
  const activities = activitiesQuery.data ?? []
  const afterRideActivity = getAfterRideActivity(activities)
  const progressPercentage = goal ? getGoalProgressPercentage(goal, currentGoalValue) : 0
  const activityState = getActivityDataState(activities)
  const coachDecision = getDeterministicCoachDecision(activities, workoutsQuery.data ?? [])
  const currentWeekWorkouts = getCurrentWeekWorkouts(workoutsQuery.data ?? [])
  const completedThisWeek = currentWeekWorkouts.filter((workout) => workout.status === 'completed')
  const weekCompletion = getPlanCompletionPercentage(currentWeekWorkouts)

  // Every tile compares the last seven days with the seven before, so the change
  // it shows is between two spans of equal length.
  const volumeDelta = getWindowDelta(getWeeklyVolumeSeries(activities))
  const rideDelta = getWindowDelta(getWeeklyRideCountSeries(activities))
  const distanceDelta = getWindowDelta(getWeeklyDistanceSeries(activities))

  const insight = getDeterministicTrainingInsight(
    activities,
    athleteQuery.data?.weeklyVolumeBand ?? '3to6',
    { t, plural },
  )
  const hasError =
    athleteQuery.isError ||
    activitiesQuery.isError ||
    goalQuery.isError ||
    currentValueQuery.isError ||
    workoutsQuery.isError

  // Loaded whatever the goal is: the FTP tile belongs on the dashboard whenever
  // a figure is on record, not only to riders who made it their objective.
  useEffect(() => {
    void loadFtpHistory().then(setFtpHistory)
  }, [])

  const latestFtp = ftpHistory.at(-1) ?? null
  const previousFtp = ftpHistory.at(-2) ?? null
  const ftpDelta =
    latestFtp !== null && previousFtp !== null ? latestFtp.value - previousFtp.value : null

  // Needs an FTP and rides recorded with power, so it is null for most riders —
  // and null rather than an invented split.
  const intensity = getIntensityDistribution(activities, latestFtp?.value ?? null)

  // `navigate` rather than `push`: these targets are tabs, so they should be
  // switched to, not stacked on top of the current one.
  const openTab = (href: Href) => {
    router.navigate(href)
  }

  const connectStrava = async () => {
    setIsConnecting(true)
    setConnectError(null)

    const result = await stravaService.connect()

    if (result.ok) {
      await setStrava(result.connection)
      await reconcileStoredStravaConnection()
      // The activities come from Strava, so the figures on this screen are
      // stale the moment the connection lands.
      await activitiesQuery.refetch()
    } else {
      setConnectError(t(STRAVA_ERROR_KEYS[result.error.code], result.error.params))
    }

    setIsConnecting(false)
  }

  return (
    <AppShell header={<AppBrandHeader />}>
      <AppScrollView>
        <YStack gap="$5">
          <OnboardingSaveFeedback />
          {/*
            The page answers the product question in order: where the rider
            stands relative to the goal, then what to do next, then supporting
            detail. The goal used to appear twice — in this card and again in a
            "Progression" section further down — which halved the impact of both.
          */}
          <YStack gap="$1">
            <GradntHeading>{t('home.title')}</GradntHeading>
            <GradntText muted>{t('home.subtitle')}</GradntText>
          </YStack>

          {hasError ? (
            <GradntText color="$danger" fontSize={13}>
              {activitiesQuery.isError
                ? describeActivityFailure(activitiesQuery.error, t)
                : t('home.unavailable')}
            </GradntText>
          ) : null}

          <GradntGoalCard
            eyebrow={goalEyebrow(t)}
            goalLabel={goal ? goalTypeLabel(t, goal.type) : t('home.goalNone')}
            targetLabel={goalTargetLabel(t, goal ?? null)}
            currentValue={currentGoalValue}
            progressPercentage={progressPercentage}
            statusLabel={
              currentGoalValue === null ? t('home.status.startingPoint') : t('home.status.onTrack')
            }
            changeLabel={
              goal?.type === 'ftp' && ftpDelta !== null
                ? t('home.ftpSince', {
                    delta: `${ftpDelta >= 0 ? '+' : ''}${ftpDelta}`,
                  })
                : currentGoalValue === null
                  ? t('home.afterFirstRides')
                  : t('home.observedProgress')
            }
            changeRising={goal?.type === 'ftp' && ftpDelta !== null && ftpDelta > 0}
          />

          <GradntCard gap="$3">
            <GradntHeading level={3}>{t('home.week.title')}</GradntHeading>
            <XStack justifyContent="space-between">
              <GradntText muted>
                {t('home.week.summary', {
                  completed: completedThisWeek.length,
                  total: currentWeekWorkouts.length,
                })}
              </GradntText>
              <GradntText weight="semibold">{weekCompletion}%</GradntText>
            </XStack>
            <GradntProgressBar value={weekCompletion} />
          </GradntCard>

          <GradntCard accent gap="$3">
            <GradntText weight="semibold">{t('home.coach.title')}</GradntText>
            <GradntText>
              {t(`home.coach.${coachDecision.kind}`, {
                hours: coachDecision.recentHours,
              })}
            </GradntText>
            <GradntText muted fontSize={11}>
              {t('home.coach.deterministic')}
            </GradntText>
            {coachDecision.nextWorkoutId ? (
              <GradntButton
                tone="secondary"
                onPress={() => router.push(`/plan/${coachDecision.nextWorkoutId}` as Href)}
              >
                {t('home.coach.openPlan')}
              </GradntButton>
            ) : null}
          </GradntCard>

          {nextWorkout ? (
            <GradntCard gap="$3">
              <GradntSectionHeader
                title={t('home.nextStep')}
                action={t('common.see')}
                onPress={() => openTab('/plan')}
              />
              <GradntWorkoutCard
                day={formatDate(new Date(nextWorkout.date), 'EEEE d MMM', { locale: dateLocale })}
                title={workoutTitle(t, nextWorkout.type)}
                duration={formatWorkoutDuration(nextWorkout.durationMinutes)}
                intensity={workoutIntensity(t, nextWorkout.type)}
                actionLabel={t('plan.workout.see')}
                onPress={() => router.push(`/plan/${nextWorkout.id}` as Href)}
              />
            </GradntCard>
          ) : null}

          {afterRideActivity ? (
            <AfterRidePrompt key={afterRideActivity.id} activity={afterRideActivity} />
          ) : null}

          {/* An account with manual or FIT rides has real progress without Strava. */}
          {connected || activities.length > 0 ? (
            <YStack gap="$4">
              <GradntSectionHeader
                title={t('home.yourState')}
                action={t('common.seeMore')}
                onPress={() => openTab('/progress')}
              />

              {/* Two columns, so a tile keeps a readable width and the grid
                  stays even whether the FTP tile is there or not. */}
              <YStack gap="$3">
                <XStack gap="$3">
                  <GradntStatTile
                    label={t('home.tiles.volume')}
                    value={volumeDelta ? String(volumeDelta.current) : '—'}
                    unit="h"
                    delta={volumeDelta?.delta ?? null}
                  />

                  <GradntStatTile
                    label={t('home.tiles.rides')}
                    value={rideDelta ? String(rideDelta.current) : '—'}
                    delta={rideDelta?.delta ?? null}
                  />
                </XStack>

                <XStack gap="$3">
                  <GradntStatTile
                    label={t('home.tiles.distance')}
                    value={distanceDelta ? String(distanceDelta.current) : '—'}
                    unit="km"
                    delta={distanceDelta?.delta ?? null}
                  />

                  {/* Only where a figure is on record: an empty FTP tile would
                      be a permanent hole for a rider who has never set one. */}
                  {latestFtp !== null ? (
                    <GradntStatTile
                      label="FTP"
                      value={String(latestFtp.value)}
                      unit="W"
                      delta={ftpDelta}
                    />
                  ) : null}
                </XStack>
              </YStack>
            </YStack>
          ) : null}
          {!connected ? (
            <GradntStravaConnectBlock
              onConnect={() => void connectStrava()}
              isConnecting={isConnecting}
              errorMessage={connectError}
              title={t('onboarding.strava.title')}
              description={t('settings.strava.connectNote')}
              connectLabel={t('settings.strava.connect')}
              connectingLabel={t('settings.strava.connecting')}
            />
          ) : null}

          {/*
            Only where the split can actually be known — it needs an FTP and
            rides recorded with power. Absent rather than empty: a block saying
            "no data" on a dashboard is worse than no block.
          */}
          {intensity ? (
            <YStack gap="$4">
              {/* No destination exists for this section, so it carries no action
                  rather than a chevron that goes nowhere. */}
              <GradntSectionHeader title={t('home.intensities')} />
              <GradntIntensityBreakdown
                distribution={intensity}
                caption={(hours) => t('home.intensityPoweredHours', { hours })}
              />
            </YStack>
          ) : null}

          <GradntCard padding="$4" gap="$3">
            <GradntText weight="semibold">{insight.title}</GradntText>
            <GradntText muted fontSize={13} lineHeight={19}>
              {insight.message}
            </GradntText>
            <GradntText muted fontSize={11}>
              {activityState === 'none' ? t('home.basedOnProfile') : t('home.basedOnActivities')}
            </GradntText>
          </GradntCard>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
