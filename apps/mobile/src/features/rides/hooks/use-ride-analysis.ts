import { useQuery } from '@tanstack/react-query'

import { useAppLanguage } from '@/i18n'
import type { Activity, RideAnalysis } from '@/lib/domain'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import type { FeedbackDraft } from '../domain/ride-feedback'
import { fetchAiRideAnalysis } from '../services/ride-analysis.service'

export function useRideAnalysisQuery(
  activity: Activity | undefined,
  facts: RideAnalysis | null,
  feedback: FeedbackDraft | null | undefined,
) {
  const language = useAppLanguage()
  const ready = useOnboardingStore(
    (state) =>
      state.hydrated && state.completed && !state.persistenceError && Boolean(state.cloud?.userId),
  )
  return useQuery({
    queryKey: [
      'ride-ai-analysis',
      activity?.id,
      feedback?.note,
      feedback?.perceivedEffort,
      language,
    ],
    enabled: Boolean(ready && activity && facts),
    retry: false,
    staleTime: 1000 * 60 * 30,
    queryFn: () =>
      fetchAiRideAnalysis({
        locale: language,
        facts: facts as RideAnalysis,
        feedback: feedback ?? null,
      }),
  })
}
