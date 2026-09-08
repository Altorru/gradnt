import {
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
  useCurrentGoalValueQuery,
  useGoalQuery,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'
import { getGoalProgressPercentage, getNextWorkout } from '@/lib/domain'
import { XStack, YStack } from 'tamagui'

import { AppBrandHeader } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'

export function HomeScreen() {
  const goalQuery = useGoalQuery()
  const currentValueQuery = useCurrentGoalValueQuery()
  const workoutsQuery = useUpcomingWorkoutsQuery()

  const goal = goalQuery.data
  const currentValue = currentValueQuery.data ?? null
  const nextWorkout = getNextWorkout(workoutsQuery.data ?? [])
  const progressPercentage = goal ? getGoalProgressPercentage(goal, currentValue) : 0
  const hasError = goalQuery.isError || currentValueQuery.isError || workoutsQuery.isError
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
            currentValue={currentValue ?? undefined}
            progressPercentage={progressPercentage || undefined}
          />

          <YStack gap="$4">
            <GradntSectionHeader title="Ton état" action="Voir plus" />

            <XStack gap="$3">
              <GradntStatusCard
                label="Forme"
                value={isLoading ? '—' : '78 ↗'}
                detail={isLoading ? 'Chargement' : 'Bonne'}
                accent
                visual={<GradntSparkline data={[46, 54, 67, 59, 72, 78, 73, 86]} />}
              />
              <GradntStatusCard
                label="Charge"
                value={isLoading ? '—' : 'Modérée'}
                valueSize={21}
                detail={isLoading ? 'Chargement' : 'Stable'}
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

          <YStack gap="$4">
            <GradntSectionHeader title="Progression" />
            <XStack alignItems="center" justifyContent="space-around">
              <GradntProgressRing value={progressPercentage || 78} />
              <YStack gap="$2">
                <GradntText muted fontSize={12}>
                  Derniers 30 jours
                </GradntText>
                <GradntText weight="bold" fontSize={26}>
                  +6 W
                </GradntText>
                <GradntText color="$accent" weight="semibold" fontSize={13}>
                  FTP estimée
                </GradntText>
              </YStack>
            </XStack>
          </YStack>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
