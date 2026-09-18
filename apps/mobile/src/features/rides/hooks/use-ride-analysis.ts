import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import type { RideAnalysisRequest } from '../services/ride-analysis.service'
import { generateRideAnalysis, loadSavedRideAnalysis } from '../services/ride-analysis.service'

function useCloudAnalysisReady() {
  return useOnboardingStore(
    (state) =>
      state.hydrated && state.completed && !state.persistenceError && Boolean(state.cloud?.userId),
  )
}

export function useSavedRideAnalysisQuery(activityId: string) {
  const ready = useCloudAnalysisReady()
  return useQuery({
    queryKey: ['ride-ai-analysis', activityId],
    enabled: ready && activityId.length > 0,
    staleTime: 1000 * 60 * 30,
    queryFn: () => loadSavedRideAnalysis(activityId),
  })
}

export function useGenerateRideAnalysisMutation(activityId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RideAnalysisRequest) => generateRideAnalysis(input),
    onSuccess: (analysis) => {
      queryClient.setQueryData(['ride-ai-analysis', activityId], analysis)
    },
  })
}
