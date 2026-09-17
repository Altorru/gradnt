import { CalendarDays, ChevronRight } from '@tamagui/lucide-icons-2'
import { format as formatDate } from 'date-fns'
import { useRouter, type Href } from 'expo-router'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntProgressBar,
  GradntText,
} from '@/design-system'
import {
  useMoveWorkoutMutation,
  useSkipWorkoutMutation,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'
import { useDateLocale, useNumberFormat, useTranslation, type Translate } from '@/i18n'
import { getPlanCompletionPercentage } from '@/lib/domain'

import { AppBrandHeader, AppScreenIntro } from '../components/AppHeader'
import { AppScrollView, AppShell } from '../components/AppShell'
import { formatWorkoutDuration, workoutIntensity, workoutTitle } from '../domain/workout-labels'

const statusTone = {
  planned: 'neutral',
  completed: 'positive',
  skipped: 'danger',
  moved: 'warning',
} as const

/** The same words the workout screen uses: one state, one name. */
function statusLabels(t: Translate) {
  return {
    planned: t('plan.status.planned'),
    completed: t('plan.status.completed'),
    skipped: t('plan.status.skipped'),
    moved: t('plan.status.moved'),
  }
}

export function PlanScreen() {
  const { t, plural } = useTranslation()
  const dateLocale = useDateLocale()
  const formatNumber = useNumberFormat()
  const router = useRouter()
  const workoutsQuery = useUpcomingWorkoutsQuery()
  const skipWorkout = useSkipWorkoutMutation()
  const moveWorkout = useMoveWorkoutMutation()
  const workouts = workoutsQuery.data ?? []
  /**
   * The summary card covers the plan's own first week, not all four.
   *
   * The plan is written four weeks ahead so a reminder can outlive a gap between
   * opens, and this card said "this week" while counting every session in it.
   *
   * The window comes from the plan rather than from the clock — a date read
   * during render is impure, and the first week is the earliest session plus
   * seven days by construction.
   */
  const firstWeekStart = workouts.reduce(
    (earliest, workout) => Math.min(earliest, Date.parse(workout.date)),
    Number.POSITIVE_INFINITY,
  )
  const thisWeek = workouts.filter(
    (workout) => Date.parse(workout.date) < firstWeekStart + 7 * 24 * 60 * 60 * 1000,
  )
  const plannedWorkouts = thisWeek.filter((workout) => workout.status === 'planned')
  const completedWorkouts = thisWeek.filter((workout) => workout.status === 'completed')
  const trackedWorkouts = thisWeek.filter((workout) => workout.status !== 'planned')
  const completionPercentage = getPlanCompletionPercentage(thisWeek)
  const plannedMinutes = plannedWorkouts.reduce(
    (total, workout) => total + workout.durationMinutes,
    0,
  )
  const isMutating = skipWorkout.isPending || moveWorkout.isPending

  return (
    <AppShell header={<AppBrandHeader />}>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro title={t('plan.title')} description={t('plan.description')} />

          {workoutsQuery.isError ? (
            <GradntCard padding="$4" gap="$3">
              <GradntText color="$danger" fontSize={13} weight="semibold">
                {t('plan.unavailable')}
              </GradntText>
              <GradntButton tone="secondary" onPress={() => void workoutsQuery.refetch()}>
                {t('common.retry')}
              </GradntButton>
            </GradntCard>
          ) : null}

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={20} color="$accentInk" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">{t('plan.thisWeek')}</GradntText>
                <GradntText muted fontSize={13}>
                  {workoutsQuery.isPending
                    ? t('common.loading')
                    : thisWeek.length
                      ? `${t('plan.upcoming', { count: plannedWorkouts.length })} · ${plural('plan.completed', completedWorkouts.length)}`
                      : t('plan.nonePlanned')}
                </GradntText>
              </YStack>
              <GradntBadge tone={completionPercentage === 100 ? 'positive' : 'neutral'}>
                {workoutsQuery.isPending ? '—' : `${completionPercentage}%`}
              </GradntBadge>
            </XStack>
            {!workoutsQuery.isPending && thisWeek.length ? (
              <YStack gap="$2">
                <XStack justifyContent="space-between">
                  <GradntText muted fontSize={12}>
                    {t('plan.progress')}
                  </GradntText>
                  <GradntText muted fontSize={12}>
                    {t('plan.tracked', {
                      tracked: trackedWorkouts.length,
                      total: thisWeek.length,
                    })}
                  </GradntText>
                </XStack>
                <GradntProgressBar value={completionPercentage} />
                <GradntText muted fontSize={12}>
                  {plannedMinutes
                    ? t('plan.remaining', {
                        hours: formatNumber(plannedMinutes / 60, { maximumFractionDigits: 1 }),
                      })
                    : t('plan.weekTracked')}
                </GradntText>
              </YStack>
            ) : null}
          </GradntCard>

          {!workoutsQuery.isPending && !workoutsQuery.isError && workouts.length === 0 ? (
            <GradntCard padding="$4" gap="$2">
              <GradntHeading level={3}>{t('plan.emptyTitle')}</GradntHeading>
              <GradntText muted>{t('plan.emptyNote')}</GradntText>
            </GradntCard>
          ) : null}

          <YStack gap="$3">
            {workouts.map((workout) => (
              <GradntCard key={workout.id} padding="$4" gap="$3">
                <XStack
                  alignItems="center"
                  gap="$3"
                  onPress={() => {
                    router.push(`/plan/${workout.id}` as Href)
                  }}
                >
                  <YStack flex={1} gap="$1">
                    <GradntText muted fontSize={11} weight="semibold" letterSpacing={0.7}>
                      {formatDate(new Date(workout.date), 'EEEE', { locale: dateLocale })}
                    </GradntText>
                    <GradntText weight="semibold">{workoutTitle(t, workout.type)}</GradntText>
                    <GradntText muted fontSize={13}>
                      {formatWorkoutDuration(workout.durationMinutes)} ·{' '}
                      {workoutIntensity(t, workout.type)}
                    </GradntText>
                  </YStack>
                  <GradntBadge tone={statusTone[workout.status]}>
                    {statusLabels(t)[workout.status]}
                  </GradntBadge>
                  <ChevronRight size={18} color="$textSecondary" />
                </XStack>

                {workout.status === 'planned' ? (
                  <XStack gap="$2">
                    <YStack flex={1}>
                      <GradntButton
                        tone="ghost"
                        minHeight={44}
                        disabled={isMutating}
                        onPress={() => {
                          skipWorkout.mutate(workout.id)
                        }}
                      >
                        {t('plan.skip')}
                      </GradntButton>
                    </YStack>
                    <YStack flex={1}>
                      <GradntButton
                        tone="secondary"
                        minHeight={44}
                        disabled={isMutating}
                        onPress={() => {
                          const nextDate = new Date(workout.date)
                          nextDate.setDate(nextDate.getDate() + 1)
                          moveWorkout.mutate({ workoutId: workout.id, date: nextDate })
                        }}
                      >
                        {t('plan.moveOneDay')}
                      </GradntButton>
                    </YStack>
                  </XStack>
                ) : null}
              </GradntCard>
            ))}
          </YStack>
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
