import { ArrowLeft, CheckCircle2, Clock3, SkipForward } from '@tamagui/lucide-icons-2'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntIconButton,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import {
  useCompleteWorkoutMutation,
  useSkipWorkoutMutation,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'

const statusLabels = {
  planned: 'À venir',
  completed: 'Terminée',
  skipped: 'Sautée',
  moved: 'Déplacée',
} as const

export function WorkoutDetailScreen() {
  const router = useRouter()
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>()
  const workoutsQuery = useUpcomingWorkoutsQuery()
  const completeWorkout = useCompleteWorkoutMutation()
  const skipWorkout = useSkipWorkoutMutation()
  const workout = workoutsQuery.data?.find((candidate) => candidate.id === workoutId)

  if (!workout) {
    return (
      <GradntScreen>
        <YStack flex={1} gap="$4">
          <GradntIconButton onPress={() => router.back()}>
            <ArrowLeft size={18} />
          </GradntIconButton>
          <GradntHeading>Séance introuvable</GradntHeading>
          <GradntText muted>Cette séance n’est plus disponible dans ton plan local.</GradntText>
        </YStack>
      </GradntScreen>
    )
  }

  const isPending = completeWorkout.isPending || skipWorkout.isPending

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$7">
          <GradntIconButton onPress={() => router.back()}>
            <ArrowLeft size={18} />
          </GradntIconButton>

          <YStack gap="$2">
            <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
              {new Date(workout.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </GradntText>
            <XStack alignItems="center" justifyContent="space-between" gap="$3">
              <GradntHeading>{workout.title}</GradntHeading>
              <GradntBadge
                tone={
                  workout.status === 'completed'
                    ? 'positive'
                    : workout.status === 'skipped'
                      ? 'danger'
                      : 'neutral'
                }
              >
                {statusLabels[workout.status]}
              </GradntBadge>
            </XStack>
          </YStack>

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <Clock3 size={20} color="$accent" />
              <YStack gap="$1">
                <GradntText weight="semibold">Durée et intensité</GradntText>
                <GradntText muted fontSize={13}>
                  {workout.durationMinutes} min · {workout.intensityTarget}
                </GradntText>
              </YStack>
            </XStack>
            <GradntText lineHeight={21}>{workout.structure}</GradntText>
          </GradntCard>

          <GradntCard gap="$3">
            <GradntText weight="semibold">Pourquoi cette séance ?</GradntText>
            <GradntText muted lineHeight={21}>
              {workout.reason}
            </GradntText>
          </GradntCard>

          {workout.status === 'planned' || workout.status === 'moved' ? (
            <YStack gap="$3">
              <GradntButton
                disabled={isPending}
                iconAfter={<CheckCircle2 size={18} color="$onAccent" />}
                onPress={() => {
                  completeWorkout.mutate(workout.id, {
                    onSuccess: () => router.back(),
                  })
                }}
              >
                Marquer comme terminée
              </GradntButton>
              <GradntButton
                tone="ghost"
                disabled={isPending}
                iconAfter={<SkipForward size={18} color="$color" />}
                onPress={() => {
                  skipWorkout.mutate(workout.id, {
                    onSuccess: () => router.back(),
                  })
                }}
              >
                Sauter cette séance
              </GradntButton>
            </YStack>
          ) : null}
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
