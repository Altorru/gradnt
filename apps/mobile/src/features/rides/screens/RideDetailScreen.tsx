import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { format } from 'date-fns'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Modal, ScrollView } from 'react-native'
import { useState } from 'react'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntBadge,
  GradntCard,
  GradntHeading,
  GradntIconButton,
  GradntMetric,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { OnboardingSaveFeedback } from '@/features/onboarding/components/OnboardingSaveFeedback'
import {
  useActivitiesQuery,
  useAthleteQuery,
  useCurrentFtpQuery,
  useGoalQuery,
  useMoveWorkoutMutation,
  useTrainingPlanQuery,
} from '@/hooks/use-gradnt-data'
import { analyzeRide, canUseAiForActivity, compareRideToPlan } from '@/lib/domain'
import { useAppLanguage, useDateLocale, useNumberFormat, useTranslation } from '@/i18n'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import { feedbackGuidance } from '../domain/ride-feedback'
import { getAdaptationProposal } from '../domain/adaptation'
import { useRideFeedbackQuery } from '../hooks/use-ride-feedback'
import {
  useGenerateRideAnalysisMutation,
  useSavedRideAnalysisQuery,
} from '../hooks/use-ride-analysis'
import { RideAnalysisRequestError } from '../services/ride-analysis.service'
import { recordProductEvent } from '@/services/product-events'
import { workoutTitle } from '@/features/app/domain/workout-labels'

export function RideDetailScreen() {
  const { t } = useTranslation()
  const language = useAppLanguage()
  const locale = useDateLocale()
  const number = useNumberFormat()
  const router = useRouter()
  const { activityId = '' } = useLocalSearchParams<{ activityId: string }>()
  const activitiesQuery = useActivitiesQuery()
  const ftpQuery = useCurrentFtpQuery()
  const athleteQuery = useAthleteQuery()
  const goalQuery = useGoalQuery()
  const planQuery = useTrainingPlanQuery()
  const feedbackQuery = useRideFeedbackQuery(activityId)
  const [advanced, setAdvanced] = useState(false)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const ready = useOnboardingStore(
    (state) => state.hydrated && state.completed && !state.persistenceError,
  )
  const activity = activitiesQuery.data?.find((ride) => ride.id === activityId)
  const feedback = feedbackQuery.data?.feedback
  const analysis = activity
    ? analyzeRide(activity, activitiesQuery.data ?? [], ftpQuery.data ?? null, feedback?.responses)
    : null
  const analysisTrendKey = analysis
    ? (
        {
          above: 'rides.analysis.trendAbove',
          near: 'rides.analysis.trendNear',
          below: 'rides.analysis.trendBelow',
          first: 'rides.analysis.firstRide',
        } as const
      )[analysis.trend]
    : null
  const analysisNextActionKey = analysis
    ? (
        {
          recover: 'rides.analysis.nextRecover',
          endurance: 'rides.analysis.nextEndurance',
          progress: 'rides.analysis.nextProgress',
        } as const
      )[analysis.nextAction]
    : null
  const comparison = activity
    ? compareRideToPlan(activity, planQuery.data?.weeks.flatMap((week) => week.workouts) ?? [])
    : null
  const savedAnalysisQuery = useSavedRideAnalysisQuery(activityId)
  const generateAnalysisMutation = useGenerateRideAnalysisMutation(activityId)
  const moveWorkout = useMoveWorkoutMutation()
  const canUseAi = activity ? canUseAiForActivity(activity) : false
  const workouts = planQuery.data?.weeks.flatMap((week) => week.workouts) ?? []
  const upcomingWorkouts = workouts
    .filter(
      (workout) =>
        Date.parse(workout.date) >= Date.parse(activity?.startAt ?? '') &&
        workout.status !== 'skipped',
    )
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .slice(0, 3)
  const recentRides = (activitiesQuery.data ?? [])
    .filter(
      (ride) =>
        ride.id !== activityId && Date.parse(ride.startAt) < Date.parse(activity?.startAt ?? ''),
    )
    .filter((ride) => ride.source !== 'strava')
    .sort((a, b) => Date.parse(b.startAt) - Date.parse(a.startAt))
    .slice(0, 6)
  const adaptationProposal =
    activity && feedback ? getAdaptationProposal(activity, feedback.responses, workouts) : null
  const requestAnalysis = () => {
    if (!activity || !analysis || !canUseAi) return
    generateAnalysisMutation.mutate(
      {
        locale: language,
        activity,
        facts: analysis,
        feedback: feedback?.responses ?? null,
        profile: athleteQuery.data ?? null,
        goal: goalQuery.data ?? null,
        matchedWorkout: comparison?.kind === 'matched' ? comparison.workout : null,
        upcomingWorkouts,
        recentRides,
      },
      { onSuccess: () => setAnalysisOpen(true) },
    )
  }
  const analysisErrorKey = (() => {
    const error = generateAnalysisMutation.error
    if (!(error instanceof RideAnalysisRequestError)) return 'rides.analysis.errors.request'
    if (error.code === 'authentication_required') return 'rides.analysis.errors.authentication'
    if (error.code === 'strava_ai_not_permitted') return 'rides.analysis.stravaAiUnavailable'
    if (error.code === 'activity_provenance_not_permitted')
      return 'rides.analysis.errors.provenance'
    if (error.code === 'ai_not_configured') return 'rides.analysis.errors.configuration'
    if (error.code === 'ai_provider_timeout') return 'rides.analysis.errors.timeout'
    if (error.code === 'ai_provider_failed_401' || error.code === 'ai_provider_failed_403')
      return 'rides.analysis.errors.apiKey'
    if (error.code === 'ai_provider_failed_404') return 'rides.analysis.errors.model'
    if (error.code === 'ai_provider_failed_429') return 'rides.analysis.errors.quota'
    if (error.code === 'analysis_storage_failed') return 'rides.analysis.errors.storage'
    if (error.code === 'invalid_analysis_input') return 'rides.analysis.errors.data'
    return 'rides.analysis.errors.provider'
  })()
  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$5">
          <OnboardingSaveFeedback />
          <GradntIconButton
            accessibilityLabel={t('common.back')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/progress'))}
          >
            <ArrowLeft size={18} color="$textPrimary" />
          </GradntIconButton>
          {!ready ? (
            <GradntText muted>{t('common.loading')}</GradntText>
          ) : activitiesQuery.isError ? (
            <>
              <GradntText color="$danger">{t('rides.unavailable')}</GradntText>
              <GradntButton tone="secondary" onPress={() => void activitiesQuery.refetch()}>
                {t('common.retry')}
              </GradntButton>
            </>
          ) : activitiesQuery.isPending ? (
            <GradntText muted>{t('common.loading')}</GradntText>
          ) : !activity ? (
            <GradntText muted>{t('rides.notFound')}</GradntText>
          ) : (
            <>
              <YStack gap="$2">
                <GradntHeading>{t('rides.detailTitle')}</GradntHeading>
                <GradntText muted>
                  {format(new Date(activity.startAt), 'EEEE d MMMM · HH:mm', { locale })}
                </GradntText>
              </YStack>
              <GradntCard gap="$4">
                <XStack justifyContent="space-between" flexWrap="wrap" gap="$4">
                  <GradntMetric
                    label={t('rides.distance')}
                    value={number(activity.distanceMeters / 1000, { maximumFractionDigits: 1 })}
                    unit="km"
                  />
                  <GradntMetric
                    label={t('rides.duration')}
                    value={number(activity.durationSeconds / 60, { maximumFractionDigits: 0 })}
                    unit={t('rides.minutes')}
                  />
                  <GradntMetric
                    label={t('rides.elevation')}
                    value={number(activity.elevationGainMeters, { maximumFractionDigits: 0 })}
                    unit="m"
                  />
                </XStack>
                <GradntText muted fontSize={12}>
                  {t(
                    activity?.source === 'manual'
                      ? 'rides.sourceManual'
                      : activity?.source === 'file'
                        ? 'rides.sourceFile'
                        : activity?.source === 'garmin'
                          ? 'rides.sourceGarmin'
                          : 'rides.sourceStrava',
                  )}
                </GradntText>
              </GradntCard>
              <GradntCard accent gap="$3">
                <GradntText weight="semibold">{t('rides.feedback.summaryTitle')}</GradntText>
                {feedbackQuery.isError ? (
                  <>
                    <GradntText color="$danger">{t('rides.feedback.readError')}</GradntText>
                    <GradntButton tone="secondary" onPress={() => void feedbackQuery.refetch()}>
                      {t('common.retry')}
                    </GradntButton>
                  </>
                ) : feedbackQuery.isPending ? (
                  <GradntText muted>{t('common.loading')}</GradntText>
                ) : feedback ? (
                  <>
                    <GradntText muted>
                      {t('rides.feedback.savedAt', {
                        date: format(new Date(feedback.updatedAt), 'd MMM · HH:mm', { locale }),
                      })}
                    </GradntText>
                    {feedback.responses.perceivedEffort !== null ? (
                      <GradntText>
                        {t('rides.feedback.effortSummary', {
                          value: feedback.responses.perceivedEffort,
                        })}
                      </GradntText>
                    ) : null}
                    {feedback.responses.feeling !== null ? (
                      <GradntText>
                        {t('rides.feedback.feelingSummary', {
                          value: t(`rides.feedback.feelings.${feedback.responses.feeling}`),
                        })}
                      </GradntText>
                    ) : null}
                    {feedback.responses.fatigue !== null ? (
                      <GradntText>
                        {t('rides.feedback.fatigueSummary', {
                          value: t(`rides.feedback.fatigueLevels.${feedback.responses.fatigue}`),
                        })}
                      </GradntText>
                    ) : null}
                    {feedback.responses.note ? (
                      <GradntText>{feedback.responses.note}</GradntText>
                    ) : null}
                  </>
                ) : (
                  <GradntText muted>{t('rides.feedback.invitation')}</GradntText>
                )}
                <GradntButton
                  disabled={feedbackQuery.isPending || feedbackQuery.isError}
                  onPress={() =>
                    router.push({
                      pathname: '/rides/[activityId]/feedback',
                      params: { activityId },
                    })
                  }
                >
                  {t(feedback ? 'rides.feedback.edit' : 'rides.feedback.add')}
                </GradntButton>
              </GradntCard>
              {analysis ? (
                <GradntCard gap="$3">
                  <GradntHeading level={3}>{t('rides.analysis.title')}</GradntHeading>
                  <GradntText muted>{t('rides.analysis.subtitle')}</GradntText>
                  <GradntBadge>{t('rides.analysis.deterministicEngine')}</GradntBadge>
                  <GradntText muted fontSize={12}>
                    {t('rides.analysis.source', {
                      value: t(`rides.analysis.sources.${activity.source}`),
                    })}
                  </GradntText>
                  <XStack flexWrap="wrap" gap="$2">
                    <GradntMetric
                      label={t('rides.analysis.intensity')}
                      value={t(`rides.analysis.intensityLabels.${analysis.intensity}`)}
                    />
                    <GradntMetric
                      label={t('rides.analysis.load')}
                      value={t('rides.analysis.loadPoints', { value: analysis.loadScore })}
                    />
                  </XStack>
                  <GradntText>{analysisTrendKey ? t(analysisTrendKey) : null}</GradntText>
                  <XStack flexWrap="wrap" gap="$2">
                    <GradntBadge>
                      {t('rides.analysis.minutes', { value: analysis.facts.durationMinutes })}
                    </GradntBadge>
                    <GradntBadge>
                      {t('rides.analysis.distance', { value: analysis.facts.distanceKm })}
                    </GradntBadge>
                    <GradntBadge>
                      {t('rides.analysis.elevation', { value: analysis.facts.elevationMeters })}
                    </GradntBadge>
                    {analysis.facts.powerWatts !== null ? (
                      <GradntBadge>
                        {t('rides.analysis.power', { value: analysis.facts.powerWatts })}
                      </GradntBadge>
                    ) : null}
                  </XStack>
                  <GradntText weight="semibold">{t('rides.analysis.nextAction')}</GradntText>
                  <GradntText>{analysisNextActionKey ? t(analysisNextActionKey) : null}</GradntText>
                  <GradntText muted fontSize={12}>
                    {t(
                      analysis.confidence === 'power'
                        ? 'rides.analysis.confidencePower'
                        : 'rides.analysis.confidenceDuration',
                    )}{' '}
                    {t('rides.analysis.explanation')}
                  </GradntText>
                  {!canUseAi ? (
                    <GradntText muted>{t('rides.analysis.stravaAiUnavailable')}</GradntText>
                  ) : savedAnalysisQuery.data ? (
                    <GradntButton onPress={() => setAnalysisOpen(true)}>
                      {t('rides.analysis.viewAi')}
                    </GradntButton>
                  ) : (
                    <GradntButton
                      disabled={generateAnalysisMutation.isPending}
                      onPress={requestAnalysis}
                    >
                      {t(
                        generateAnalysisMutation.isPending
                          ? 'rides.analysis.aiLoading'
                          : 'rides.analysis.generate',
                      )}
                    </GradntButton>
                  )}
                  {generateAnalysisMutation.isError ? (
                    <YStack gap="$2">
                      <GradntText color="$warning">{t(analysisErrorKey)}</GradntText>
                      {generateAnalysisMutation.error instanceof RideAnalysisRequestError &&
                      generateAnalysisMutation.error.providerMessage ? (
                        <GradntText muted fontSize={12}>
                          {generateAnalysisMutation.error.providerMessage}
                        </GradntText>
                      ) : null}
                      {generateAnalysisMutation.error instanceof RideAnalysisRequestError &&
                      generateAnalysisMutation.error.code === 'authentication_required' ? (
                        <GradntButton tone="secondary" onPress={() => router.push('/account')}>
                          {t('account.signIn')}
                        </GradntButton>
                      ) : null}
                    </YStack>
                  ) : null}
                </GradntCard>
              ) : null}
              {comparison?.kind === 'matched' ? (
                <GradntCard gap="$3">
                  <GradntHeading level={3}>{t('rides.comparison.title')}</GradntHeading>
                  <GradntText>
                    {t('rides.comparison.matched', {
                      workout: workoutTitle(t, comparison.workout.type),
                    })}
                  </GradntText>
                  <XStack flexWrap="wrap" gap="$2">
                    <GradntBadge>
                      {t('rides.comparison.planned', { value: comparison.workout.durationMinutes })}
                    </GradntBadge>
                    <GradntBadge>
                      {t('rides.comparison.actual', { value: comparison.actualMinutes })}
                    </GradntBadge>
                  </XStack>
                  <GradntText>
                    {t(
                      (
                        {
                          shorter: 'rides.comparison.shorter',
                          on_target: 'rides.comparison.onTarget',
                          longer: 'rides.comparison.longer',
                        } as const
                      )[comparison.outcome],
                      { value: Math.abs(comparison.differenceMinutes) },
                    )}
                  </GradntText>
                  <GradntText muted fontSize={12}>
                    {t('rides.comparison.control')}
                  </GradntText>
                  {comparison.workout.status === 'planned' ||
                  comparison.workout.status === 'moved' ? (
                    <GradntButton
                      tone="secondary"
                      onPress={() => router.push(`/plan/${comparison.workout.id}`)}
                    >
                      {t('rides.comparison.review')}
                    </GradntButton>
                  ) : null}
                </GradntCard>
              ) : comparison?.kind === 'unplanned' ? (
                <GradntCard gap="$2">
                  <GradntText weight="semibold">{t('rides.comparison.unplannedTitle')}</GradntText>
                  <GradntText muted>{t('rides.comparison.unplanned')}</GradntText>
                </GradntCard>
              ) : null}
              {feedback ? (
                <GradntCard gap="$3">
                  <GradntText weight="semibold">{t('rides.nextStep')}</GradntText>
                  <GradntText>
                    {t(`rides.guidance.${feedbackGuidance(feedback.responses)}`)}
                  </GradntText>
                  <GradntText muted fontSize={12}>
                    {t('rides.guidance.explanation')}
                  </GradntText>
                  <GradntButton tone="secondary" onPress={() => router.push('/plan')}>
                    {t('rides.viewPlan')}
                  </GradntButton>
                </GradntCard>
              ) : null}
              {adaptationProposal?.kind === 'move' ? (
                <GradntCard accent gap="$3">
                  <GradntHeading level={3}>{t('rides.adaptation.title')}</GradntHeading>
                  <GradntText>
                    {t('rides.adaptation.move', {
                      workout: workoutTitle(t, adaptationProposal.workout.type),
                      date: format(new Date(adaptationProposal.newDate), 'EEEE d MMM', { locale }),
                    })}
                  </GradntText>
                  <GradntText muted fontSize={12}>
                    {t('rides.adaptation.explanation')}
                  </GradntText>
                  <GradntButton
                    disabled={moveWorkout.isPending}
                    onPress={() =>
                      moveWorkout.mutate(
                        {
                          workoutId: adaptationProposal.workout.id,
                          date: new Date(adaptationProposal.newDate),
                        },
                        { onSuccess: () => void recordProductEvent('adaptation_accepted') },
                      )
                    }
                  >
                    {t(
                      moveWorkout.isPending ? 'rides.adaptation.saving' : 'rides.adaptation.accept',
                    )}
                  </GradntButton>
                  {moveWorkout.isSuccess ? (
                    <GradntText color="$positive">{t('rides.adaptation.saved')}</GradntText>
                  ) : null}
                </GradntCard>
              ) : null}
              <GradntButton tone="ghost" onPress={() => setAdvanced(!advanced)}>
                {t(advanced ? 'rides.hideAdvanced' : 'rides.showAdvanced')}
              </GradntButton>
              {advanced ? (
                <GradntCard gap="$3">
                  <GradntText weight="semibold">{t('rides.sensors')}</GradntText>
                  <GradntText>
                    {t('rides.power', {
                      value:
                        activity.averagePower === null
                          ? '—'
                          : number(activity.averagePower, { maximumFractionDigits: 0 }),
                    })}
                  </GradntText>
                  <GradntText>
                    {t('rides.heartRate', {
                      value:
                        activity.averageHeartRate === null
                          ? '—'
                          : number(activity.averageHeartRate, { maximumFractionDigits: 0 }),
                    })}
                  </GradntText>
                  <GradntText muted fontSize={12}>
                    {t('rides.missingSensors')}
                  </GradntText>
                </GradntCard>
              ) : null}
            </>
          )}
        </YStack>
      </GradntScrollView>
      <Modal
        animationType="fade"
        transparent
        visible={analysisOpen}
        onRequestClose={() => setAnalysisOpen(false)}
      >
        <YStack
          flex={1}
          justifyContent="center"
          padding="$5"
          backgroundColor="$background"
          opacity={0.96}
        >
          <YStack
            backgroundColor="$backgroundElevated"
            borderColor="$border"
            borderWidth={1}
            borderRadius="$6"
            padding="$5"
            width="90%"
            maxWidth={560}
            maxHeight="82%"
            alignSelf="center"
            accessibilityViewIsModal
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <YStack gap="$4">
                <GradntHeading level={2}>{t('rides.analysis.aiTitle')}</GradntHeading>
                {savedAnalysisQuery.data ? (
                  <>
                    <GradntHeading level={3}>{savedAnalysisQuery.data.headline}</GradntHeading>
                    <GradntText>{savedAnalysisQuery.data.explanation}</GradntText>
                    <YStack gap="$1">
                      <GradntText weight="semibold">{t('rides.analysis.goalImpact')}</GradntText>
                      <GradntText>{savedAnalysisQuery.data.goalImpact}</GradntText>
                    </YStack>
                    <YStack gap="$1">
                      <GradntText weight="semibold">{t('rides.analysis.aiNextStep')}</GradntText>
                      <GradntText>{savedAnalysisQuery.data.nextStep}</GradntText>
                    </YStack>
                    {savedAnalysisQuery.data.caution ? (
                      <GradntText color="$warning">{savedAnalysisQuery.data.caution}</GradntText>
                    ) : null}
                  </>
                ) : null}
                <GradntButton tone="secondary" onPress={() => setAnalysisOpen(false)}>
                  {t('common.closePanel')}
                </GradntButton>
                {canUseAi ? (
                  <GradntButton
                    tone="ghost"
                    disabled={generateAnalysisMutation.isPending}
                    onPress={requestAnalysis}
                  >
                    {t('rides.analysis.refreshAi')}
                  </GradntButton>
                ) : null}
              </YStack>
            </ScrollView>
          </YStack>
        </YStack>
      </Modal>
    </GradntScreen>
  )
}
