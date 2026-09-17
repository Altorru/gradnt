import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { planRepository } from '../services/plan.repository'
import { gradntRepository } from '../services/gradnt.repository'

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

export function useAthleteQuery({ enabled = true }: QueryGate = {}) {
  return useQuery({
    queryKey: ['athlete'],
    enabled,
    queryFn: () => gradntRepository.getAthlete(),
  })
}

export function useGoalQuery({ enabled = true }: QueryGate = {}) {
  return useQuery({
    queryKey: ['goal'],
    enabled,
    queryFn: () => gradntRepository.getGoal(),
  })
}

export function useCurrentGoalValueQuery({ enabled = true }: QueryGate = {}) {
  return useQuery({
    queryKey: ['goal-current-value'],
    enabled,
    queryFn: () => gradntRepository.getCurrentGoalValue(),
  })
}
export function useActivitiesQuery({ enabled = true }: QueryGate = {}) {
  return useQuery({
    queryKey: ['activities'],
    enabled,
    queryFn: () => gradntRepository.getActivities(),
  })
}

export function useTrainingMetricsQuery() {
  return useQuery({
    queryKey: ['training-metrics'],
    queryFn: () => gradntRepository.getTrainingMetrics(),
  })
}

export function useTrainingPlanQuery() {
  return useQuery({
    queryKey: ['training-plan'],
    queryFn: () => planRepository.getPlan(),
  })
}

export function useSkipWorkoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (workoutId: string) => planRepository.skipWorkout(workoutId),
    onSuccess: (plan) => {
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
      queryClient.setQueryData(['training-plan'], plan)
      queryClient.setQueryData(
        ['upcoming-workouts'],
        plan.weeks.flatMap((week) => week.workouts),
      )
    },
  })
}

export function useUpcomingWorkoutsQuery({ enabled = true }: QueryGate = {}) {
  return useQuery({
    queryKey: ['upcoming-workouts'],
    enabled,
    queryFn: async () => {
      const plan = await planRepository.getPlan()
      return plan.weeks.flatMap((week) => week.workouts)
    },
  })
}
