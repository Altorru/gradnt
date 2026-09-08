import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { planRepository } from '../services/plan.repository'
import { gradntRepository } from '../services/gradnt.repository'

export function useAthleteQuery() {
  return useQuery({
    queryKey: ['athlete'],
    queryFn: () => gradntRepository.getAthlete(),
  })
}

export function useGoalQuery() {
  return useQuery({
    queryKey: ['goal'],
    queryFn: () => gradntRepository.getGoal(),
  })
}

export function useCurrentGoalValueQuery() {
  return useQuery({
    queryKey: ['goal-current-value'],
    queryFn: () => gradntRepository.getCurrentGoalValue(),
  })
}
export function useActivitiesQuery() {
  return useQuery({
    queryKey: ['activities'],
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

export function useUpcomingWorkoutsQuery() {
  return useQuery({
    queryKey: ['upcoming-workouts'],
    queryFn: async () => {
      const plan = await planRepository.getPlan()
      return plan.weeks.flatMap((week) => week.workouts)
    },
  })
}
