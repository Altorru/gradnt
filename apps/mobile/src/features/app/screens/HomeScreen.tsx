import {
  GradntCard,
  GradntChip,
  GradntGoalCard,
  GradntHeading,
  GradntMiniBars,
  GradntProgressRing,
  GradntSectionHeader,
  GradntSparkline,
  GradntStatusCard,
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
import {
  getActivityDataState,
  getDeterministicTrainingInsight,
  getGoalProgressPercentage,
  getNextWorkout,
} from '@/lib/domain'
import { XStack, YStack } from 'tamagui'

import { AppBrandHeader } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

export function HomeScreen() {
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

  return (
    <AppShell header={<AppBrandHeader />}>
      <AppScrollView>
        <YStack gap="$7">
          <YStack gap="$1">
            <GradntHeading>Ton prochain pas</GradntHeading>
            <GradntText muted>
              Une vue claire de ta progression et de ce qui vient ensuite.
            </GradntText>
          </YStack>

          {hasError ? (
            <GradntText color="$danger" fontSize={13}>
              Les données de progression sont momentanément indisponibles.
            </GradntText>
          ) : null}

          <GradntGoalCard
            goal={goal}
            currentValue={currentGoalValue ?? undefined}
            progressPercentage={progressPercentage || undefined}
            statusLabel={
              currentValueQuery.data?.provenance === 'mock' ? 'DÉMO LOCALE' : 'EN BONNE VOIE'
            }
            changeLabel={
              currentValueQuery.data?.provenance === 'mock'
                ? 'Valeur illustrative'
                : '+6 W ce mois-ci'
            }
          />

          <YStack gap="$4">
            <GradntSectionHeader title="Ton état" action="Voir plus" />

            <XStack gap="$3">
              <GradntStatusCard
                label="Forme"
                value={isLoading ? '—' : 'Profil'}
                detail={isLoading ? 'Chargement' : 'Déclaré'}
                accent
                visual={<GradntSparkline data={[46, 54, 67, 59, 72, 78, 73, 86]} />}
              />
              <GradntStatusCard
                label="Historique"
                value={
                  activityState === 'observed'
                    ? 'Importé'
                    : activityState === 'mock'
                      ? 'Démo'
                      : 'À venir'
                }
                valueSize={21}
                detail={activityState === 'observed' ? 'Strava' : 'Plus précis après tes sorties'}
                visual={<GradntMiniBars data={[18, 32, 52, 38, 29]} activeIndices={[0, 1, 2]} />}
              />
            </XStack>
          </YStack>

          <YStack gap="$4">
            <GradntSectionHeader title="Prochaine étape" action="Voir" />
            <GradntWorkoutCard workout={nextWorkout ?? undefined} />
          </YStack>

          <YStack gap="$4">
            <GradntSectionHeader title="Intensités" action="Voir toutes" />
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
                : activityState === 'mock'
                  ? 'Données locales de démonstration'
                  : 'Basé sur des activités observées'}
            </GradntText>
          </GradntCard>

          <YStack gap="$4">
            <GradntSectionHeader title="Progression" />
            <XStack alignItems="center" justifyContent="space-around">
              <GradntProgressRing value={progressPercentage || 78} />
              <YStack gap="$2">
                <GradntText muted fontSize={12}>
                  Objectif principal
                </GradntText>
                <GradntText weight="bold" fontSize={26}>
                  {currentGoalValue ?? '—'} W
                </GradntText>
                <GradntText color="$accent" weight="semibold" fontSize={13}>
                  Valeur de démonstration
                </GradntText>
              </YStack>
            </XStack>
          </YStack>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
