import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { format } from 'date-fns'
import { useLocalSearchParams, useRouter } from 'expo-router'
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
import { useActivitiesQuery, useCurrentFtpQuery } from '@/hooks/use-gradnt-data'
import { analyzeRide } from '@/lib/domain'
import { useDateLocale, useNumberFormat, useTranslation } from '@/i18n'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import { feedbackGuidance } from '../domain/ride-feedback'
import { useRideFeedbackQuery } from '../hooks/use-ride-feedback'
import { useRideAnalysisQuery } from '../hooks/use-ride-analysis'

export function RideDetailScreen() {
  const { t } = useTranslation()
  const locale = useDateLocale()
  const number = useNumberFormat()
  const router = useRouter()
  const { activityId = '' } = useLocalSearchParams<{ activityId: string }>()
  const activitiesQuery = useActivitiesQuery()
  const ftpQuery = useCurrentFtpQuery()
  const feedbackQuery = useRideFeedbackQuery(activityId)
  const [advanced, setAdvanced] = useState(false)
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
  const aiAnalysisQuery = useRideAnalysisQuery(activity, analysis, feedback?.responses)
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
                  {t('rides.sourceStrava')}
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
                  {aiAnalysisQuery.data ? (
                    <GradntCard backgroundColor="$backgroundSubtle" gap="$2" padding="$3">
                      <GradntText weight="semibold">{aiAnalysisQuery.data.headline}</GradntText>
                      <GradntText>{aiAnalysisQuery.data.explanation}</GradntText>
                      <GradntText>
                        {t('rides.analysis.aiNextStep')}: {aiAnalysisQuery.data.nextStep}
                      </GradntText>
                      {aiAnalysisQuery.data.caution ? (
                        <GradntText color="$warning">{aiAnalysisQuery.data.caution}</GradntText>
                      ) : null}
                    </GradntCard>
                  ) : null}
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
    </GradntScreen>
  )
}
