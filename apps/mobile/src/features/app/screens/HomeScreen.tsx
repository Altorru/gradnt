import { format as formatDate } from 'date-fns'
import { useRouter, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  GradntCard,
  GradntGoalCard,
  GradntHeading,
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
  getDeterministicTrainingInsight,
  getGoalProgressPercentage,
  getIntensityDistribution,
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
  const progressPercentage = goal ? getGoalProgressPercentage(goal, currentGoalValue) : 0
  const activityState = getActivityDataState(activities)

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
      setStrava(result.connection)
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
        <YStack gap="$7">
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
          />

          <YStack gap="$4">
            <GradntSectionHeader
              title={t('home.nextStep')}
              action={t('common.see')}
              onPress={() => openTab('/plan')}
            />
            {/* Nothing rather than a demo session. The card used to fall back
                to its own sample values, so a rider with an empty plan was
                shown a plausible session that was nobody's. */}
            {nextWorkout ? (
              <GradntWorkoutCard
                day={formatDate(new Date(nextWorkout.date), 'EEEE d MMM', { locale: dateLocale })}
                title={workoutTitle(t, nextWorkout.type)}
                duration={formatWorkoutDuration(nextWorkout.durationMinutes)}
                intensity={workoutIntensity(t, nextWorkout.type)}
                actionLabel={t('plan.workout.see')}
                onPress={() => router.push(`/plan/${nextWorkout.id}` as Href)}
              />
            ) : (
              <GradntText muted fontSize={13}>
                {t('plan.nonePlanned')}
              </GradntText>
            )}
          </YStack>

          {/*
            Keyed on the connection, not on the activity list. A rider who is
            connected but has not ridden yet also has no activities, and asking
            them to connect again would be plainly wrong.
          */}
          {connected ? (
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
          ) : (
            <GradntStravaConnectBlock
              onConnect={() => void connectStrava()}
              isConnecting={isConnecting}
              errorMessage={connectError}
              title={t('onboarding.strava.title')}
              description={t('settings.strava.connectNote')}
              connectLabel={t('settings.strava.connect')}
              connectingLabel={t('settings.strava.connecting')}
            />
          )}

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
              <GradntIntensityBreakdown distribution={intensity} />
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
