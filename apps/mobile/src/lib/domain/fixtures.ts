import {
  activitySchema,
  athleteProfileSchema,
  goalSchema,
  plannedWorkoutSchema,
  trainingMetricsSchema,
  trainingPlanSchema,
  type Activity,
  type AthleteProfile,
  type Goal,
  type PlannedWorkout,
  type TrainingMetrics,
  type TrainingPlan,
} from './schemas'

const athleteFixtureInput = {
  id: 'athlete-demo',
  displayName: 'Cycliste GRADNT',
  primaryDiscipline: 'road' as const,
  experienceLevel: 'regular' as const,
  weeklyVolumeBand: '3to6' as const,
}

const goalFixtureInput = {
  id: 'goal-ftp-demo',
  type: 'ftp' as const,
  targetValue: 280,
  targetUnit: 'w' as const,
  targetDate: null,
  status: 'active' as const,
  createdAt: '2026-09-01T08:00:00.000Z',
}

const workoutsFixtureInput = [
  {
    id: 'workout-demo-1',
    date: '2026-09-08T07:00:00.000Z',
    type: 'endurance' as const,
    title: 'Endurance fondamentale',
    durationMinutes: 60,
    intensityTarget: 'Facile',
    structure: 'Continu, conversation confortable',
    status: 'planned' as const,
    reason: 'Construire une base régulière avant la prochaine séance intense.',
  },
  {
    id: 'workout-demo-2',
    date: '2026-09-10T07:00:00.000Z',
    type: 'sweet_spot' as const,
    title: 'Sweet Spot',
    durationMinutes: 75,
    intensityTarget: '88–94 % FTP',
    structure: '3 × 12 min, récupération 5 min',
    status: 'planned' as const,
    reason: 'Développer la puissance durable en restant compatible avec ton volume actuel.',
  },
  {
    id: 'workout-demo-3',
    date: '2026-09-12T08:00:00.000Z',
    type: 'endurance' as const,
    title: 'Sortie longue',
    durationMinutes: 120,
    intensityTarget: 'Endurance',
    structure: 'Continu, allure stable',
    status: 'planned' as const,
    reason: 'Faire progresser l’endurance sans augmenter brutalement la charge.',
  },
]

const metricsFixtureInput = {
  periodStart: '2026-08-10T00:00:00.000Z',
  periodEnd: '2026-09-07T23:59:59.000Z',
  durationSeconds: 16320,
  distanceMeters: 142000,
  elevationGainMeters: 1840,
  activityCount: 8,
}

const activitiesFixtureInput = [
  {
    id: 'activity-demo-1',
    source: 'manual' as const,
    externalId: null,
    sportType: 'road' as const,
    startAt: '2026-09-06T08:00:00.000Z',
    durationSeconds: 5400,
    distanceMeters: 48000,
    elevationGainMeters: 520,
    averageHeartRate: 138,
    maxHeartRate: 166,
    averagePower: 186,
    normalizedPower: null,
    weightedPower: null,
    calories: 620,
  },
]

export const demoAthlete: AthleteProfile = athleteProfileSchema.parse(athleteFixtureInput)
export const demoGoal: Goal = goalSchema.parse(goalFixtureInput)
export const demoWorkouts: PlannedWorkout[] = workoutsFixtureInput.map((workout) =>
  plannedWorkoutSchema.parse(workout),
)
export const demoMetrics: TrainingMetrics = trainingMetricsSchema.parse(metricsFixtureInput)
export const demoActivities: Activity[] = activitiesFixtureInput.map((activity) =>
  activitySchema.parse(activity),
)

export const demoTrainingPlan: TrainingPlan = trainingPlanSchema.parse({
  id: 'plan-demo',
  startDate: '2026-09-07T00:00:00.000Z',
  endDate: '2026-09-13T23:59:59.000Z',
  goalId: demoGoal.id,
  weeks: [{ weekNumber: 1, workouts: demoWorkouts }],
  version: 1,
  status: 'active',
})
