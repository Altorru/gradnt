import { useState } from 'react'
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
  useArchivedPlansQuery,
  useAvailabilityExceptionsQuery,
  useSaveAvailabilityExceptionMutation,
  usePlanUpdateReasonQuery,
  useStartNewPlanMutation,
  useTrainingPlanQuery,
} from '@/hooks/use-gradnt-data'
import { useDateLocale, useNumberFormat, useTranslation, type Translate } from '@/i18n'
import {
  getPlanCompletionPercentage,
  getCurrentWeekWorkouts,
  groupWorkoutsByWeek,
  isUpcomingWorkout,
  startOfCyclingWeek,
} from '@/lib/domain'

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
  const planQuery = useTrainingPlanQuery()
  const moveWorkout = useMoveWorkoutMutation()
  const archives = useArchivedPlansQuery()
  const [showHistory, setShowHistory] = useState(false)
  const updateReason = usePlanUpdateReasonQuery()
  const startNewPlan = useStartNewPlanMutation()
  const exceptionsQuery = useAvailabilityExceptionsQuery()
  const saveException = useSaveAvailabilityExceptionMutation()
  const [confirmingNewPlan, setConfirmingNewPlan] = useState(false)
  const [showWeekChanges, setShowWeekChanges] = useState(false)
  const workouts = planQuery.data?.weeks.flatMap((week) => week.workouts) ?? []
  const weeks = groupWorkoutsByWeek(workouts)
  const thisWeek = getCurrentWeekWorkouts(workouts)
  const currentWeekStart = startOfCyclingWeek(new Date()).getTime()
  const weekLabelOf = (week: (typeof weeks)[number]) =>
    week.startDate.getTime() === currentWeekStart
      ? t('plan.thisWeek')
      : t('plan.weekOf', { date: formatDate(week.startDate, 'd MMM', { locale: dateLocale }) })
  const plannedWorkouts = thisWeek.filter(isUpcomingWorkout)
  const completedWorkouts = thisWeek.filter((workout) => workout.status === 'completed')
  const trackedWorkouts = thisWeek.filter(
    (workout) => workout.status === 'completed' || workout.status === 'skipped',
  )
  const completionPercentage = getPlanCompletionPercentage(thisWeek)
  const plannedMinutes = plannedWorkouts.reduce(
    (total, workout) => total + workout.durationMinutes,
    0,
  )
  const isMutating = moveWorkout.isPending || startNewPlan.isPending || saveException.isPending
  const nextPlannedWorkout = plannedWorkouts[0]

  return (
    <AppShell header={<AppBrandHeader />}>
      <AppScrollView>
        <YStack gap="$7">
          <AppScreenIntro title={t('plan.title')} description={t('plan.description')} />

          {planQuery.data?.legacyCalendarReconstructed ? (
            <GradntCard gap="$2">
              <GradntText>{t('plan.legacyCalendarNote')}</GradntText>
            </GradntCard>
          ) : null}

          {planQuery.isError ? (
            <GradntCard padding="$4" gap="$3">
              <GradntText color="$danger" fontSize={13} weight="semibold">
                {t('plan.unavailable')}
              </GradntText>
              <GradntButton tone="secondary" onPress={() => void planQuery.refetch()}>
                {t('common.retry')}
              </GradntButton>
            </GradntCard>
          ) : null}

          {updateReason.data ? (
            <GradntCard gap="$3">
              <GradntHeading level={3}>
                {t(
                  updateReason.data === 'settings_changed'
                    ? 'plan.settingsChanged'
                    : 'plan.finished',
                )}
              </GradntHeading>
              <GradntText muted>{t('plan.newPlanNote')}</GradntText>
              <GradntButton
                disabled={isMutating}
                onPress={() => {
                  if (!confirmingNewPlan) {
                    setConfirmingNewPlan(true)
                    return
                  }
                  startNewPlan.mutate(undefined, { onSuccess: () => setConfirmingNewPlan(false) })
                }}
              >
                {t(confirmingNewPlan ? 'plan.confirmNewPlan' : 'plan.prepareNewPlan')}
              </GradntButton>
              {confirmingNewPlan ? (
                <GradntButton
                  tone="ghost"
                  disabled={isMutating}
                  onPress={() => setConfirmingNewPlan(false)}
                >
                  {t('common.cancel')}
                </GradntButton>
              ) : null}
            </GradntCard>
          ) : null}
          {moveWorkout.isError || startNewPlan.isError ? (
            <GradntCard gap="$3">
              <GradntText color="$danger" accessibilityLiveRegion="polite">
                {t('common.saveFailed')}
              </GradntText>
              <GradntButton
                tone="secondary"
                onPress={() => {
                  moveWorkout.reset()
                  startNewPlan.reset()
                  void planQuery.refetch()
                  void updateReason.refetch()
                }}
              >
                {t('plan.reload')}
              </GradntButton>
            </GradntCard>
          ) : null}
          {nextPlannedWorkout ? (
            <GradntCard accent gap="$3">
              <YStack gap="$1">
                <GradntText muted fontSize={12} weight="semibold" letterSpacing={0.7}>
                  {t('plan.nextSession')}
                </GradntText>
                <GradntHeading level={3}>{workoutTitle(t, nextPlannedWorkout.type)}</GradntHeading>
                <GradntText muted>
                  {formatDate(new Date(nextPlannedWorkout.date), 'EEEE d MMM', {
                    locale: dateLocale,
                  })}{' '}
                  · {formatWorkoutDuration(nextPlannedWorkout.durationMinutes)}
                </GradntText>
              </YStack>
              <GradntButton onPress={() => router.push(`/plan/${nextPlannedWorkout.id}` as Href)}>
                {t('plan.workout.see')}
              </GradntButton>
            </GradntCard>
          ) : null}

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <CalendarDays size={20} color="$accentInk" />
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">{t('plan.thisWeek')}</GradntText>
                <GradntText muted fontSize={13}>
                  {planQuery.isPending
                    ? t('common.loading')
                    : thisWeek.length
                      ? `${t('plan.upcoming', { count: plannedWorkouts.length })} · ${plural('plan.completed', completedWorkouts.length)}`
                      : t('plan.nonePlanned')}
                </GradntText>
              </YStack>
              <GradntBadge tone={completionPercentage === 100 ? 'positive' : 'neutral'}>
                {planQuery.isPending ? '—' : `${completionPercentage}%`}
              </GradntBadge>
            </XStack>
            {!planQuery.isPending && thisWeek.length ? (
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

          {nextPlannedWorkout ? (
            <YStack gap="$3">
              <GradntButton tone="ghost" onPress={() => setShowWeekChanges((current) => !current)}>
                {t(showWeekChanges ? 'plan.exception.hide' : 'plan.exception.show')}
              </GradntButton>
              {showWeekChanges ? (
                <GradntCard gap="$3">
                  <GradntHeading level={3}>{t('plan.exception.title')}</GradntHeading>
                  <GradntText muted>{t('plan.exception.description')}</GradntText>
                  <GradntButton
                    tone="secondary"
                    disabled={isMutating}
                    onPress={() => {
                      const date = new Date(nextPlannedWorkout.date)
                      saveException.mutate({
                        date: date.toISOString(),
                        available: false,
                        note: 'availability_exception',
                      })
                      date.setDate(date.getDate() + 1)
                      moveWorkout.mutate({ workoutId: nextPlannedWorkout.id, date })
                    }}
                  >
                    {t('plan.exception.action')}
                  </GradntButton>
                  {exceptionsQuery.data?.exceptions.length ? (
                    <GradntText muted fontSize={12}>
                      {t('plan.exception.saved', { count: exceptionsQuery.data.exceptions.length })}
                    </GradntText>
                  ) : null}
                </GradntCard>
              ) : null}
            </YStack>
          ) : null}

          {!planQuery.isPending && !planQuery.isError && workouts.length === 0 ? (
            <GradntCard padding="$4" gap="$2">
              <GradntHeading level={3}>{t('plan.emptyTitle')}</GradntHeading>
              <GradntText muted>{t('plan.emptyNote')}</GradntText>
            </GradntCard>
          ) : null}

          {weeks.map((week) => (
            <YStack key={week.startDate.toISOString()} gap="$3">
              <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                {weekLabelOf(week)}
              </GradntText>

              {week.workouts.map((workout) => (
                <GradntCard key={workout.id} padding="$4" gap="$3">
                  <XStack
                    accessibilityRole="button"
                    accessibilityLabel={t('plan.workout.see')}
                    alignItems="center"
                    gap="$3"
                    onPress={() => {
                      router.push(`/plan/${workout.id}` as Href)
                    }}
                  >
                    <YStack flex={1} gap="$1">
                      <GradntText muted fontSize={11} weight="semibold" letterSpacing={0.7}>
                        {formatDate(new Date(workout.date), 'EEEE d MMM', { locale: dateLocale })}
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
                </GradntCard>
              ))}
            </YStack>
          ))}
          {archives.data?.length ? (
            <YStack gap="$3">
              <GradntButton tone="secondary" onPress={() => setShowHistory(!showHistory)}>
                {t(showHistory ? 'plan.hideHistory' : 'plan.showHistory')}
              </GradntButton>
              {showHistory
                ? [...archives.data].reverse().map((oldPlan) => (
                    <GradntCard key={oldPlan.id} gap="$3">
                      <GradntText weight="semibold">
                        {t('plan.archivedCalendar', {
                          date: formatDate(new Date(oldPlan.startDate), 'd MMM yyyy', {
                            locale: dateLocale,
                          }),
                        })}
                      </GradntText>
                      {oldPlan.weeks
                        .flatMap((week) => week.workouts)
                        .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
                        .map((workout) => (
                          <YStack key={workout.id} gap="$1">
                            <GradntText>
                              {formatDate(new Date(workout.date), 'd MMM', { locale: dateLocale })}{' '}
                              · {workoutTitle(t, workout.type)}
                            </GradntText>
                            <GradntText muted fontSize={12}>
                              {formatWorkoutDuration(workout.durationMinutes)} ·{' '}
                              {statusLabels(t)[workout.status]}
                            </GradntText>
                          </YStack>
                        ))}
                    </GradntCard>
                  ))
                : null}
            </YStack>
          ) : null}
          {archives.isError ? (
            <GradntButton tone="secondary" onPress={() => void archives.refetch()}>
              {t('plan.retryHistory')}
            </GradntButton>
          ) : null}
        </YStack>
      </AppScrollView>
    </AppShell>
  )
}
