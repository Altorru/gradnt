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
import { useTranslation } from '@/i18n'
import { STRAVA_ERROR_KEYS } from '@/features/onboarding/domain/strava.schema'
import { stravaService } from '@/features/onboarding/services/strava.service'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import type { FtpEntry } from '@/services/ftp/ftp.persistence'
import { loadFtpHistory } from '@/services/ftp/ftp.service'

export function HomeScreen() {
  const { t } = useTranslation()
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
            <GradntHeading>Ton prochain pas</GradntHeading>
            <GradntText muted>
              Une vue claire de ta progression et de ce qui vient ensuite.
            </GradntText>
          </YStack>

          {hasError ? (
            <GradntText color="$danger" fontSize={13}>
              {activitiesQuery.isError
                ? describeActivityFailure(activitiesQuery.error)
                : 'Les données de progression sont momentanément indisponibles.'}
            </GradntText>
          ) : null}

          <GradntGoalCard
            goal={goal ?? undefined}
            currentValue={currentGoalValue ?? undefined}
            progressPercentage={progressPercentage || undefined}
            statusLabel={currentGoalValue === null ? 'POINT DE DÉPART' : 'EN BONNE VOIE'}
            changeLabel={
              goal?.type === 'ftp' && ftpDelta !== null
                ? `${ftpDelta >= 0 ? '+' : ''}${ftpDelta} W depuis le dernier relevé`
                : currentGoalValue === null
                  ? 'Après tes premières sorties'
                  : 'Progression observée'
            }
          />

          <YStack gap="$4">
            <GradntSectionHeader
              title="Prochaine étape"
              action="Voir"
              onPress={() => openTab('/plan')}
            />
            <GradntWorkoutCard workout={nextWorkout ?? undefined} />
          </YStack>

          {/*
            Keyed on the connection, not on the activity list. A rider who is
            connected but has not ridden yet also has no activities, and asking
            them to connect again would be plainly wrong.
          */}
          {connected ? (
            <YStack gap="$4">
              <GradntSectionHeader
                title="Ton état"
                action="Voir plus"
                onPress={() => openTab('/progress')}
              />

              {/* Two columns, so a tile keeps a readable width and the grid
                  stays even whether the FTP tile is there or not. */}
              <YStack gap="$3">
                <XStack gap="$3">
                  <GradntStatTile
                    label="Volume 7 j"
                    value={volumeDelta ? String(volumeDelta.current) : '—'}
                    unit="h"
                    delta={volumeDelta?.delta ?? null}
                  />

                  <GradntStatTile
                    label="Sorties 7 j"
                    value={rideDelta ? String(rideDelta.current) : '—'}
                    delta={rideDelta?.delta ?? null}
                  />
                </XStack>

                <XStack gap="$3">
                  <GradntStatTile
                    label="Distance 7 j"
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
              <GradntSectionHeader title="Intensités" />
              <GradntIntensityBreakdown distribution={intensity} />
            </YStack>
          ) : null}

          <GradntCard padding="$4" gap="$3">
            <GradntText weight="semibold">{insight.title}</GradntText>
            <GradntText muted fontSize={13} lineHeight={19}>
              {insight.message}
            </GradntText>
            <GradntText muted fontSize={11}>
              {activityState === 'none'
                ? 'Basé sur ton profil déclaré'
                : 'Basé sur des activités observées'}
            </GradntText>
          </GradntCard>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
