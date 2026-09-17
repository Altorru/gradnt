import {
  generateFirstPlan,
  getNextWorkout,
  trainingPlanSchema,
  type PlannedWorkout,
  type TrainingPlan,
} from '@/lib/domain'
import {
  loadOnboardingSnapshot,
  type OnboardingSnapshot,
} from '@/features/onboarding/services/onboarding.persistence'

import { loadPlanOverrides, type PlanOverride } from './plan.persistence'
import { applyPlanOverrides } from './plan-overrides'
import {
  loadPlanState,
  savePlanState,
  planInputsSchema,
  type PlanInputs,
  type StoredPlanState,
} from './plan-state.persistence'

export type PlanUpdateReason = 'settings_changed' | 'finished' | null

export interface PlanRepository {
  getPlan(): Promise<TrainingPlan>
  getUpdateReason(): Promise<PlanUpdateReason>
  getArchivedPlans(): Promise<TrainingPlan[]>
  startNewPlan(): Promise<TrainingPlan>
  skipWorkout(workoutId: string): Promise<TrainingPlan>
  completeWorkout(workoutId: string): Promise<TrainingPlan>
  moveWorkout(workoutId: string, date: Date): Promise<TrainingPlan>
}

type PlanDependencies = {
  load: () => Promise<StoredPlanState | null>
  save: (state: StoredPlanState) => Promise<void>
  loadSnapshot: () => Promise<OnboardingSnapshot | null>
  loadLegacyOverrides: () => Promise<PlanOverride[]>
  now: () => Date
  createId: () => string
}

let sequence = 0
const dependencies: PlanDependencies = {
  load: loadPlanState,
  save: savePlanState,
  loadSnapshot: loadOnboardingSnapshot,
  loadLegacyOverrides: loadPlanOverrides,
  now: () => new Date(),
  createId: () => `plan-${Date.now()}-${++sequence}`,
}

// Separate callers share the same record. Rejected writes do not block retries.
let pending: Promise<unknown> = Promise.resolve()
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation)
  pending = result.catch(() => undefined)
  return result
}

function inputsFrom(snapshot: OnboardingSnapshot | null): PlanInputs | null {
  const parsed = planInputsSchema.safeParse(snapshot)
  return parsed.success ? parsed.data : null
}

function inputsKey(inputs: PlanInputs): string {
  return JSON.stringify({
    ...inputs,
    availability: [...inputs.availability].sort((a, b) => a.day.localeCompare(b.day)),
  })
}

function emptyPlan(now: Date): TrainingPlan {
  return {
    id: 'plan-empty',
    startDate: now.toISOString(),
    endDate: now.toISOString(),
    goalId: 'goal-local',
    weeks: [],
    version: 1,
    status: 'active',
  }
}

export class LocalPlanRepository implements PlanRepository {
  constructor(private readonly storage: PlanDependencies = dependencies) {}

  private generate(inputs: PlanInputs): TrainingPlan {
    const now = this.storage.now()
    const id = this.storage.createId()
    const weeks = generateFirstPlan({ ...inputs, startDate: now, planId: id })
    const workouts = weeks.flatMap((week) => week.workouts)
    return trainingPlanSchema.parse({
      id,
      startDate: now.toISOString(),
      endDate: workouts.at(-1)?.date ?? now.toISOString(),
      goalId: 'goal-local',
      weeks,
      version: 1,
      status: 'active',
    })
  }

  private async readOrCreate(): Promise<StoredPlanState | null> {
    const existing = await this.storage.load()
    if (existing) return existing
    const snapshot = await this.storage.loadSnapshot()
    const inputs = inputsFrom(snapshot)
    if (!inputs) return null
    const plan = this.generate(inputs)
    // Legacy local overrides never stored the original calendar. Freeze their
    // currently reconstructible projection once. Never import another account's
    // local history into a cloud workspace.
    const legacy = snapshot?.cloud ? [] : await this.storage.loadLegacyOverrides()
    const migrated = legacy.map((override) => ({
      ...override,
      workoutId: override.workoutId.replace(/^first-plan-/, `${plan.id}-`),
    }))
    const state: StoredPlanState = {
      schemaVersion: 1,
      inputs,
      plan: {
        ...applyPlanOverrides(plan, migrated),
        legacyCalendarReconstructed: migrated.length > 0,
      },
      archivedPlans: [],
      cloud: snapshot?.cloud ? { userId: snapshot.cloud.userId, revision: 0 } : undefined,
    }
    await this.storage.save(state)
    return (await this.storage.load()) ?? state
  }

  getPlan(): Promise<TrainingPlan> {
    return serialize(async () => (await this.readOrCreate())?.plan ?? emptyPlan(this.storage.now()))
  }

  getArchivedPlans(): Promise<TrainingPlan[]> {
    return serialize(async () => (await this.storage.load())?.archivedPlans ?? [])
  }

  getUpdateReason(): Promise<PlanUpdateReason> {
    return serialize(async () => {
      const state = await this.readOrCreate()
      const inputs = inputsFrom(await this.storage.loadSnapshot())
      if (!state || !inputs) return null
      if (inputsKey(state.inputs) !== inputsKey(inputs)) return 'settings_changed'
      return getNextWorkout(getPlanWorkouts(state.plan), this.storage.now()) === null
        ? 'finished'
        : null
    })
  }

  /** Explicitly replace the calendar; preserve its completed and skipped history. */
  startNewPlan(): Promise<TrainingPlan> {
    return serialize(async () => {
      const state = await this.storage.load()
      const inputs = inputsFrom(await this.storage.loadSnapshot())
      if (!inputs) throw new Error('plan_inputs_missing')
      const plan = this.generate(inputs)
      await this.storage.save({
        schemaVersion: 1,
        inputs,
        plan,
        cloud: state?.cloud,
        archivedPlans: state ? [...state.archivedPlans, { ...state.plan, status: 'archived' }] : [],
      })
      return plan
    })
  }

  private update(workoutId: string, status: PlannedWorkout['status'], date?: Date) {
    return serialize(async () => {
      const state = await this.readOrCreate()
      const workout = state && getPlanWorkouts(state.plan).find((item) => item.id === workoutId)
      if (!state || !workout) throw new Error('workout_not_found')
      if (workout.status === 'completed' || workout.status === 'skipped') {
        if (workout.status === status) return state.plan
        throw new Error('workout_already_tracked')
      }
      const updated = applyPlanOverrides(state.plan, [
        {
          workoutId,
          status,
          date: date?.toISOString() ?? null,
        },
      ])
      const plan = trainingPlanSchema.parse({ ...updated, version: state.plan.version + 1 })
      await this.storage.save({ ...state, plan })
      return plan
    })
  }

  skipWorkout(workoutId: string) {
    return this.update(workoutId, 'skipped')
  }
  completeWorkout(workoutId: string) {
    return this.update(workoutId, 'completed')
  }
  moveWorkout(workoutId: string, date: Date) {
    return this.update(workoutId, 'moved', date)
  }
}

export const planRepository = new LocalPlanRepository()

export function getPlanWorkouts(plan: TrainingPlan): PlannedWorkout[] {
  return plan.weeks.flatMap((week) => week.workouts)
}
