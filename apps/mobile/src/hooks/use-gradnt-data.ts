import { useQuery } from '@tanstack/react-query'

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
    queryFn: () => gradntRepository.getTrainingPlan(),
  })
}

export function useUpcomingWorkoutsQuery() {
  return useQuery({
    queryKey: ['upcoming-workouts'],
    queryFn: () => gradntRepository.getUpcomingWorkouts(),
  })
}
