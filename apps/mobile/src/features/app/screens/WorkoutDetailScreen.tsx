import { ArrowLeft, CheckCircle2, Clock3, SkipForward } from '@tamagui/lucide-icons-2'
import { format as formatDate } from 'date-fns'
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
import { useDateLocale, useTranslation, type Translate } from '@/i18n'
import {
  useCompleteWorkoutMutation,
  useSkipWorkoutMutation,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'

/** What a workout's state is called, per language. */
function statusLabels(t: Translate) {
  return {
    planned: t('plan.status.planned'),
    completed: t('plan.status.completed'),
    skipped: t('plan.status.skipped'),
    moved: t('plan.status.moved'),
  }
}

export function WorkoutDetailScreen() {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()
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
          <GradntHeading>{t('plan.workout.notFoundTitle')}</GradntHeading>
          <GradntText muted>{t('plan.workout.notFound')}</GradntText>
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
              {formatDate(new Date(workout.date), 'EEEE d MMMM', { locale: dateLocale })}
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
                {statusLabels(t)[workout.status]}
              </GradntBadge>
            </XStack>
          </YStack>

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <Clock3 size={20} color="$accentInk" />
              <YStack gap="$1">
                <GradntText weight="semibold">{t('plan.workout.durationAndIntensity')}</GradntText>
                <GradntText muted fontSize={13}>
                  {workout.durationMinutes} min · {workout.intensityTarget}
                </GradntText>
              </YStack>
            </XStack>
            <GradntText lineHeight={21}>{workout.structure}</GradntText>
          </GradntCard>

          <GradntCard gap="$3">
            <GradntText weight="semibold">{t('plan.workout.whyThisSession')}</GradntText>
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
                {t('plan.workout.markCompleted')}
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
                {t('plan.workout.skip')}
              </GradntButton>
            </YStack>
          ) : null}
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
