import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { planRepository } from '../services/plan.repository'
import { gradntRepository } from '../services/gradnt.repository'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'

/**
 * Whether a caller is ready for the answer yet.
 *
 * Before onboarding runs there is no profile to derive a plan, a goal or a
 * value from, and these queries answer "nothing" — an answer the cache then
 * keeps for its ten-minute staleTime. Anything mounted before the rider has a
 * profile has to hold them back, or the screens that mount afterwards read the
 * empty answer and never ask again.
 */
type QueryGate = { enabled?: boolean }

function useDataReady(enabled = true): boolean {
  return useOnboardingStore((state) => state.hydrated && state.completed) && enabled
}

export function useAthleteQuery({ enabled = true }: QueryGate = {}) {
  const ready = useDataReady(enabled)
  return useQuery({
    queryKey: ['athlete'],
    enabled: ready,
    queryFn: () => gradntRepository.getAthlete(),
  })
}

export function useGoalQuery({ enabled = true }: QueryGate = {}) {
  const ready = useDataReady(enabled)
  return useQuery({
    queryKey: ['goal'],
    enabled: ready,
    queryFn: () => gradntRepository.getGoal(),
  })
}

export function useCurrentGoalValueQuery({ enabled = true }: QueryGate = {}) {
  const ready = useDataReady(enabled)
  return useQuery({
    queryKey: ['goal-current-value'],
    enabled: ready,
    queryFn: () => gradntRepository.getCurrentGoalValue(),
  })
}
export function useActivitiesQuery({ enabled = true }: QueryGate = {}) {
  const ready = useDataReady(enabled)
  return useQuery({
    queryKey: ['activities'],
    enabled: ready,
    queryFn: () => gradntRepository.getActivities(),
  })
}

export function useTrainingMetricsQuery() {
  const ready = useDataReady()
  return useQuery({
    queryKey: ['training-metrics'],
    enabled: ready,
    queryFn: () => gradntRepository.getTrainingMetrics(),
  })
}

export function useTrainingPlanQuery() {
  const ready = useDataReady()
  return useQuery({
    queryKey: ['training-plan'],
    enabled: ready,
    queryFn: () => planRepository.getPlan(),
  })
}

export function usePlanUpdateReasonQuery() {
  const ready = useDataReady()
  return useQuery({
    queryKey: ['training-plan-update'],
    enabled: ready,
    queryFn: () => planRepository.getUpdateReason(),
  })
}

export function useArchivedPlansQuery() {
  const ready = useDataReady()
  return useQuery({
    queryKey: ['training-plan-history'],
    enabled: ready,
    queryFn: () => planRepository.getArchivedPlans(),
  })
}

export function useStartNewPlanMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => planRepository.startNewPlan(),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ['training-plan-update'] })
      void queryClient.invalidateQueries({ queryKey: ['training-plan-history'] })
      queryClient.setQueryData(['training-plan'], plan)
      queryClient.setQueryData(
        ['upcoming-workouts'],
        plan.weeks.flatMap((week) => week.workouts),
      )
    },
  })
}

export function useSkipWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => planRepository.skipWorkout(workoutId),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ['training-plan-update'] })
      void queryClient.invalidateQueries({ queryKey: ['training-plan-history'] })
      queryClient.setQueryData(['training-plan'], plan)
      queryClient.setQueryData(
        ['upcoming-workouts'],
        plan.weeks.flatMap((week) => week.workouts),
      )
    },
  })
}

export function useCompleteWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => planRepository.completeWorkout(workoutId),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ['training-plan-update'] })
      void queryClient.invalidateQueries({ queryKey: ['training-plan-history'] })
      queryClient.setQueryData(['training-plan'], plan)
      queryClient.setQueryData(
        ['upcoming-workouts'],
        plan.weeks.flatMap((week) => week.workouts),
      )
    },
  })
}

export function useMoveWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ workoutId, date }: { workoutId: string; date: Date }) =>
      planRepository.moveWorkout(workoutId, date),
    onSuccess: (plan) => {
      void queryClient.invalidateQueries({ queryKey: ['training-plan-update'] })
      void queryClient.invalidateQueries({ queryKey: ['training-plan-history'] })
      queryClient.setQueryData(['training-plan'], plan)
      queryClient.setQueryData(
        ['upcoming-workouts'],
        plan.weeks.flatMap((week) => week.workouts),
      )
    },
  })
}

export function useUpcomingWorkoutsQuery({ enabled = true }: QueryGate = {}) {
  const ready = useDataReady(enabled)
  return useQuery({
    queryKey: ['upcoming-workouts'],
    enabled: ready,
    queryFn: async () => {
      const plan = await planRepository.getPlan()
      return plan.weeks.flatMap((week) => week.workouts)
    },
  })
}
