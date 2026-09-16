import { useRouter, type Href } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  GradntCard,
  GradntChip,
  GradntGoalCard,
  GradntHeading,
  GradntMiniBars,
  GradntSectionHeader,
  GradntStatusCard,
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
  getNextWorkout,
  getWeeklyVolumeSeries,
} from '@/lib/domain'
import { XStack, YStack } from 'tamagui'

import { AppBrandHeader } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'
import { stravaService } from '@/features/onboarding/services/strava.service'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import type { FtpEntry } from '@/services/ftp/ftp.persistence'
import { loadFtpHistory } from '@/services/ftp/ftp.service'

export function HomeScreen() {
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
  const volumeSeries = getWeeklyVolumeSeries(activities)
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
  const isLoading = goalQuery.isPending || currentValueQuery.isPending || workoutsQuery.isPending

  // The FTP is the one goal whose movement is worth stating: it is recorded as
  // a dated history precisely so the change between two readings is visible.
  const isFtpGoal = goal?.type === 'ftp'

  useEffect(() => {
    if (isFtpGoal) {
      void loadFtpHistory().then(setFtpHistory)
    }
  }, [isFtpGoal])

  const ftpDelta =
    ftpHistory.length >= 2
      ? ftpHistory[ftpHistory.length - 1]!.value - ftpHistory[ftpHistory.length - 2]!.value
      : null

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
      setConnectError(result.error.message)
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
              isFtpGoal && ftpDelta !== null
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

              <XStack gap="$3">
                <GradntStatusCard
                  label="Forme"
                  value={isLoading ? '—' : 'Profil'}
                  detail={isLoading ? 'Chargement' : 'Déclaré'}
                />
                <GradntStatusCard
                  label="Historique"
                  value={activityState === 'observed' ? 'Importé' : 'À venir'}
                  valueSize={21}
                  detail={activityState === 'observed' ? 'Strava' : 'Plus précis après tes sorties'}
                  visual={<GradntMiniBars data={volumeSeries} activeIndices={[]} />}
                />
              </XStack>
            </YStack>
          ) : (
            <GradntStravaConnectBlock
              onConnect={() => void connectStrava()}
              isConnecting={isConnecting}
              errorMessage={connectError}
            />
          )}

          <YStack gap="$4">
            {/* No destination exists for this section, so it carries no action
                rather than a chevron that goes nowhere. */}
            <GradntSectionHeader title="Intensités" />
            <XStack gap="$2" flexWrap="wrap">
              <GradntChip label="Endurance" selected />
              <GradntChip label="Tempo" />
              <GradntChip label="Seuil" />
              <GradntChip label="VO₂ Max" />
            </XStack>
          </YStack>

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
