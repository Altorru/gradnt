import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { useEffect, useState } from 'react'
import { useController, useForm, useWatch } from 'react-hook-form'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { YStack, XStack } from 'tamagui'

import {
  GradntButton,
  GradntCard,
  GradntChip,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { OnboardingSaveFeedback } from '@/features/onboarding/components/OnboardingSaveFeedback'
import { useTranslation } from '@/i18n'
import { useActivitiesQuery } from '@/hooks/use-gradnt-data'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import {
  effortBand,
  emptyFeedback,
  fatigueLevels,
  feelings,
  feedbackDraftSchema,
  feedbackResponsesSchema,
  type FeedbackDraft,
} from '../domain/ride-feedback'
import {
  useFeedbackScope,
  useRideFeedbackQuery,
  useSaveRideFeedbackMutation,
} from '../hooks/use-ride-feedback'
import {
  clearFeedbackDraft,
  loadFeedbackDraft,
  loadRideFeedback,
  saveFeedbackDraft,
  type FeedbackSnapshot,
  type StoredFeedbackDraft,
} from '../services/ride-feedback.repository'

function FeedbackForm({
  initial,
  draft,
  verifyActivity,
}: {
  verifyActivity: () => Promise<void>
  initial: FeedbackSnapshot
  draft: StoredFeedbackDraft | null
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const mutation = useSaveRideFeedbackMutation()
  const [snapshot, setSnapshot] = useState(initial)
  const [staleDraft, setStaleDraft] = useState(
    draft !== null && draft.baseRevision !== (initial.feedback?.revision ?? 0),
  )
  const [storageError, setStorageError] = useState(false)
  const [reloadError, setReloadError] = useState(false)
  const [reloading, setReloading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const {
    control,
    reset,
    getValues,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FeedbackDraft>({
    resolver: zodResolver(feedbackDraftSchema),
    defaultValues:
      !staleDraft && draft ? draft.responses : (initial.feedback?.responses ?? emptyFeedback),
  })
  const effort = useController({ control, name: 'perceivedEffort' }).field
  const feeling = useController({ control, name: 'feeling' }).field
  const fatigue = useController({ control, name: 'fatigue' }).field
  const note = useController({ control, name: 'note' }).field
  const values = useWatch({ control })
  const hasAnswers = feedbackResponsesSchema.safeParse(values).success
  useEffect(() => {
    if (staleDraft || submitted) return
    const parsed = feedbackDraftSchema.safeParse(values)
    if (!parsed.success) return
    void saveFeedbackDraft(snapshot.activityId, snapshot.scope, {
      responses: parsed.data,
      baseRevision: snapshot.feedback?.revision ?? 0,
    }).then(
      () => setStorageError(false),
      () => setStorageError(true),
    )
  }, [values, snapshot, staleDraft, submitted])

  const reload = async () => {
    setReloading(true)
    setReloadError(false)
    try {
      const latest = await loadRideFeedback(snapshot.activityId, snapshot.scope)
      await clearFeedbackDraft(snapshot.activityId, snapshot.scope)
      setSnapshot(latest)
      reset(latest.feedback?.responses ?? emptyFeedback)
      setStaleDraft(false)
      mutation.reset()
    } catch {
      setReloadError(true)
    } finally {
      setReloading(false)
    }
  }
  const submit = handleSubmit(async (responses) => {
    setSubmitted(true)
    try {
      // Persist the latest input before network IO, so a failed save retains it.
      await saveFeedbackDraft(snapshot.activityId, snapshot.scope, {
        responses,
        baseRevision: snapshot.feedback?.revision ?? 0,
      })
      await verifyActivity()
      await mutation.mutateAsync({ snapshot, responses })
    } catch {
      setSubmitted(false)
      setStorageError(true)
      return
    }
    // A draft-cleanup failure must not turn a successful server save into a false failure.
    await clearFeedbackDraft(snapshot.activityId, snapshot.scope).catch(() => undefined)
    if ((useOnboardingStore.getState().cloud?.userId ?? null) !== snapshot.scope) return
    router.replace({ pathname: '/rides/[activityId]', params: { activityId: snapshot.activityId } })
  })
  const later = async () => {
    try {
      if (!staleDraft)
        await saveFeedbackDraft(snapshot.activityId, snapshot.scope, {
          responses: getValues(),
          baseRevision: snapshot.feedback?.revision ?? 0,
        })
    } catch {
      setStorageError(true)
      return
    }
    if ((useOnboardingStore.getState().cloud?.userId ?? null) !== snapshot.scope) return
    router.replace({ pathname: '/rides/[activityId]', params: { activityId: snapshot.activityId } })
  }
  const disabled = isSubmitting || reloading || staleDraft || submitted

  return (
    <YStack gap="$5">
      <GradntCard accent gap="$2">
        <GradntHeading>{t('rides.feedback.title')}</GradntHeading>
        <GradntText muted>{t('rides.feedback.description')}</GradntText>
        <GradntText muted fontSize={12}>
          {t(snapshot.scope ? 'rides.feedback.privateCloud' : 'rides.feedback.privateLocal')}
        </GradntText>
      </GradntCard>
      {staleDraft ? (
        <GradntText color="$warning">{t('rides.feedback.staleDraft')}</GradntText>
      ) : null}
      {!staleDraft ? (
        <>
          <YStack gap="$3">
            <GradntText weight="semibold">{t('rides.feedback.effort')}</GradntText>
            <GradntText muted fontSize={13}>
              {t('rides.feedback.effortExplanation')}
            </GradntText>
            <XStack
              flexWrap="wrap"
              gap="$2"
              accessibilityRole="radiogroup"
              accessibilityLabel={t('rides.feedback.effort')}
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <GradntChip
                  key={value}
                  label={String(value)}
                  disabled={disabled}
                  accessibilityLabel={t('rides.feedback.effortOption', {
                    value,
                    label: t(`rides.feedback.effortBands.${effortBand(value)}`),
                  })}
                  selected={effort.value === value}
                  onPress={() => {
                    if (!disabled) effort.onChange(effort.value === value ? null : value)
                  }}
                />
              ))}
            </XStack>
            {effort.value !== null ? (
              <GradntText muted accessibilityLiveRegion="polite">
                {t('rides.feedback.effortOption', {
                  value: effort.value,
                  label: t(`rides.feedback.effortBands.${effortBand(effort.value)}`),
                })}
              </GradntText>
            ) : null}
          </YStack>
          <YStack gap="$3">
            <GradntText weight="semibold">{t('rides.feedback.feeling')}</GradntText>
            <XStack
              flexWrap="wrap"
              gap="$2"
              accessibilityRole="radiogroup"
              accessibilityLabel={t('rides.feedback.feeling')}
            >
              {feelings.map((value) => (
                <GradntChip
                  key={value}
                  disabled={disabled}
                  label={t(`rides.feedback.feelings.${value}`)}
                  selected={feeling.value === value}
                  onPress={() => {
                    if (!disabled) feeling.onChange(feeling.value === value ? null : value)
                  }}
                />
              ))}
            </XStack>
          </YStack>
          <YStack gap="$3">
            <GradntText weight="semibold">{t('rides.feedback.fatigue')}</GradntText>
            <XStack
              flexWrap="wrap"
              gap="$2"
              accessibilityRole="radiogroup"
              accessibilityLabel={t('rides.feedback.fatigue')}
            >
              {fatigueLevels.map((value) => (
                <GradntChip
                  key={value}
                  disabled={disabled}
                  label={t(`rides.feedback.fatigueLevels.${value}`)}
                  selected={fatigue.value === value}
                  onPress={() => {
                    if (!disabled) fatigue.onChange(fatigue.value === value ? null : value)
                  }}
                />
              ))}
            </XStack>
          </YStack>
          <YStack gap="$2">
            <GradntText weight="semibold">{t('rides.feedback.note')}</GradntText>
            <GradntInput
              multiline
              minHeight={110}
              textAlignVertical="top"
              maxLength={2000}
              disabled={disabled}
              accessibilityLabel={t('rides.feedback.note')}
              placeholder={t('rides.feedback.notePlaceholder')}
              value={note.value}
              onChangeText={note.onChange}
              onBlur={note.onBlur}
            />
          </YStack>
          <GradntText muted fontSize={12}>
            {t('rides.feedback.optional')}
          </GradntText>
        </>
      ) : null}
      {mutation.isError || storageError || reloadError ? (
        <GradntText color="$danger" accessibilityLiveRegion="polite">
          {t('rides.feedback.saveError')}
        </GradntText>
      ) : null}
      {staleDraft || mutation.isError ? (
        <GradntButton
          tone="secondary"
          disabled={isSubmitting || reloading}
          onPress={() => void reload()}
        >
          {t('rides.feedback.reload')}
        </GradntButton>
      ) : null}
      <GradntButton disabled={disabled || !hasAnswers} onPress={() => void submit()}>
        {t(isSubmitting ? 'common.saving' : 'rides.feedback.save')}
      </GradntButton>
      <GradntButton tone="ghost" disabled={isSubmitting || reloading} onPress={() => void later()}>
        {t('rides.feedback.later')}
      </GradntButton>
    </YStack>
  )
}

export function RideFeedbackScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { activityId = '' } = useLocalSearchParams<{ activityId: string }>()
  const scope = useFeedbackScope()
  const ready = useOnboardingStore(
    (state) => state.hydrated && state.completed && !state.persistenceError,
  )
  const activitiesQuery = useActivitiesQuery()
  const feedbackQuery = useRideFeedbackQuery(activityId)
  const draftQuery = useQuery({
    queryKey: ['ride-feedback-draft', scope, activityId],
    enabled: ready && feedbackQuery.isSuccess,
    queryFn: () => loadFeedbackDraft(activityId, scope),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 0,
    gcTime: 0,
  })
  const activity = activitiesQuery.data?.find((ride) => ride.id === activityId)
  const error = activitiesQuery.isError || feedbackQuery.isError || draftQuery.isError
  const loading =
    !ready ||
    activitiesQuery.isPending ||
    feedbackQuery.isPending ||
    draftQuery.isPending ||
    draftQuery.isFetching
  return (
    <GradntScreen>
      <GradntScrollView
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <YStack gap="$5">
          <OnboardingSaveFeedback />
          <GradntIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
            <ArrowLeft size={18} color="$textPrimary" />
          </GradntIconButton>
          {!ready ? (
            <GradntText muted>{t('common.loading')}</GradntText>
          ) : error ? (
            <>
              <GradntText color="$danger">{t('rides.unavailable')}</GradntText>
              <GradntButton
                tone="secondary"
                onPress={() => {
                  void activitiesQuery.refetch()
                  void feedbackQuery.refetch()
                  void draftQuery.refetch()
                }}
              >
                {t('common.retry')}
              </GradntButton>
            </>
          ) : !activitiesQuery.isPending && !activity ? (
            <GradntText muted>{t('rides.notFound')}</GradntText>
          ) : loading ? (
            <GradntText muted>{t('common.loading')}</GradntText>
          ) : feedbackQuery.data ? (
            <FeedbackForm
              key={`${scope ?? 'local'}.${activityId}`}
              initial={feedbackQuery.data}
              draft={draftQuery.data ?? null}
              verifyActivity={async () => {
                const result = await activitiesQuery.refetch()
                if (result.error) throw result.error
                if (!result.data?.some((ride) => ride.id === activityId))
                  throw new Error('feedback_activity_unavailable')
              }}
            />
          ) : null}
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
