import type { PlannedWorkout } from './schemas'

export function startOfCyclingWeek(now: Date): Date {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return start
}

export function getCurrentWeekWorkouts(
  workouts: PlannedWorkout[],
  now = new Date(),
): PlannedWorkout[] {
  const start = startOfCyclingWeek(now)
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  return workouts
    .filter((workout) => {
      const at = Date.parse(workout.date)
      return at >= start.getTime() && at < end.getTime()
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
}

/** Display by actual calendar date, including moves across week boundaries. */
export function groupWorkoutsByWeek(workouts: PlannedWorkout[]): {
  startDate: Date
  workouts: PlannedWorkout[]
}[] {
  const weeks = new Map<number, { startDate: Date; workouts: PlannedWorkout[] }>()
  for (const workout of [...workouts].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
    const startDate = startOfCyclingWeek(new Date(workout.date))
    const key = startDate.getTime()
    const week = weeks.get(key) ?? { startDate, workouts: [] }
    week.workouts.push(workout)
    weeks.set(key, week)
  }
  return [...weeks.values()]
}
