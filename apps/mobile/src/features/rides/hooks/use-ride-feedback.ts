import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import { recordProductEvent } from '@/services/product-events'
import { activityIdSchema, type FeedbackDraft } from '../domain/ride-feedback'
import {
  loadRideFeedback,
  saveRideFeedback,
  type FeedbackSnapshot,
  type FeedbackScope,
} from '../services/ride-feedback.repository'

export function feedbackQueryKey(activityId: string, scope: FeedbackScope) {
  return ['ride-feedback', scope, activityId] as const
}
export function useFeedbackScope() {
  return useOnboardingStore((state) => state.cloud?.userId ?? null)
}
export function useRideFeedbackQuery(activityId: string) {
  const scope = useFeedbackScope()
  const ready = useOnboardingStore(
    (state) => state.hydrated && state.completed && !state.persistenceError,
  )
  return useQuery({
    queryKey: feedbackQueryKey(activityId, scope),
    enabled: ready && activityIdSchema.safeParse(activityId).success,
    queryFn: () => loadRideFeedback(activityId, scope),
  })
}
export function useSaveRideFeedbackMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      snapshot,
      responses,
    }: {
      snapshot: FeedbackSnapshot
      responses: FeedbackDraft
    }) => saveRideFeedback(snapshot, responses),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(feedbackQueryKey(snapshot.activityId, snapshot.scope), snapshot)
      void recordProductEvent('ride_feedback_saved')
    },
  })
}
