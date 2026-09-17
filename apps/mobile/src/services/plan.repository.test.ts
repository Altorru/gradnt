import { describe, expect, it, vi } from 'vitest'

import { defaultWeeklyAvailability } from '@/features/onboarding/domain/availability.schema'
import type { OnboardingSnapshot } from '@/features/onboarding/services/onboarding.persistence'

import { LocalPlanRepository, getPlanWorkouts } from './plan.repository'
import { storedPlanStateSchema, type StoredPlanState } from './plan-state.persistence'

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }))
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}))
vi.mock('./supabase/client', () => ({ getSupabaseClient: () => null }))

function setup() {
  let state: StoredPlanState | null = null
  let now = new Date('2026-09-17T10:00:00Z')
  let sequence = 0
  let fail = false
  const snapshot: OnboardingSnapshot = {
    profile: { discipline: 'road', experience: 'regular', weeklyVolume: '3to6' },
    goal: { type: 'distance', targetValue: '100', eventName: '' },
    availability: defaultWeeklyAvailability,
    strava: null,
    currentStep: 7,
    completed: true,
  }
  const dependencies = {
    load: async () => state && storedPlanStateSchema.parse(JSON.parse(JSON.stringify(state))),
    save: async (next: StoredPlanState) => {
      if (fail) throw new Error('disk_full')
      state = storedPlanStateSchema.parse(JSON.parse(JSON.stringify(next)))
    },
    loadSnapshot: async () => snapshot,
    loadLegacyOverrides: async () => [],
    now: () => now,
    createId: () => `plan-test-${++sequence}`,
  }
  return {
    repo: new LocalPlanRepository(dependencies),
    dependencies,
    snapshot,
    setNow: (date: Date) => {
      now = date
    },
    setFailure: (value: boolean) => {
      fail = value
    },
  }
}

describe('durable training calendar', () => {
  it('preserves legacy statuses once and marks their calendar dates as reconstructed', async () => {
    const context = setup()
    const dependencies = {
      ...context.dependencies,
      loadLegacyOverrides: async () => [
        { workoutId: 'first-plan-1-1', status: 'completed' as const, date: null },
      ],
    }
    const repo = new LocalPlanRepository(dependencies)
    const migrated = await repo.getPlan()
    expect(migrated.legacyCalendarReconstructed).toBe(true)
    expect(getPlanWorkouts(migrated)[0].status).toBe('completed')
    context.setNow(new Date('2026-09-24T10:00:00Z'))
    expect(await new LocalPlanRepository(dependencies).getPlan()).toEqual(migrated)
  })

  it('does not import unowned local statuses into a signed-in cloud account', async () => {
    const context = setup()
    context.snapshot.cloud = { userId: 'new-owner', revision: 1 }
    const legacy = vi.fn(async () => [
      { workoutId: 'first-plan-1-1', status: 'completed' as const, date: null },
    ])
    const repo = new LocalPlanRepository({ ...context.dependencies, loadLegacyOverrides: legacy })
    const plan = await repo.getPlan()
    expect(legacy).not.toHaveBeenCalled()
    expect(getPlanWorkouts(plan).every((workout) => workout.status === 'planned')).toBe(true)
  })

  it('keeps dates and identities after a restart a week later', async () => {
    const context = setup()
    const original = await context.repo.getPlan()
    context.setNow(new Date('2026-09-24T10:00:00Z'))
    const restarted = new LocalPlanRepository(context.dependencies)
    expect(await restarted.getPlan()).toEqual(original)
  })

  it('keeps a moved date when the session is then completed', async () => {
    const { repo } = setup()
    const [workout] = getPlanWorkouts(await repo.getPlan())
    const movedDate = new Date('2026-10-30T08:00:00Z')
    await repo.moveWorkout(workout.id, movedDate)
    await repo.completeWorkout(workout.id)
    expect(getPlanWorkouts(await repo.getPlan())[0]).toMatchObject({
      date: movedDate.toISOString(),
      status: 'completed',
    })
    expect((await repo.getPlan()).endDate).toBe(movedDate.toISOString())
  })

  it('preserves two simultaneous actions on different sessions', async () => {
    const { repo, dependencies } = setup()
    const workouts = getPlanWorkouts(await repo.getPlan())
    await Promise.all([
      repo.skipWorkout(workouts[0].id),
      new LocalPlanRepository(dependencies).completeWorkout(workouts[1].id),
    ])
    expect(
      getPlanWorkouts(await repo.getPlan())
        .slice(0, 2)
        .map((workout) => workout.status),
    ).toEqual(['skipped', 'completed'])
  })

  it('does not silently change the plan when the profile or goal changes', async () => {
    const { repo, snapshot } = setup()
    const original = await repo.getPlan()
    if (snapshot.profile) snapshot.profile.weeklyVolume = 'gt10'
    if (snapshot.goal) snapshot.goal.targetValue = '150'
    expect(await repo.getPlan()).toEqual(original)
    expect(await repo.getUpdateReason()).toBe('settings_changed')
  })

  it('archives the old calendar and gives new sessions independent identities on confirmation', async () => {
    const { repo } = setup()
    const original = await repo.getPlan()
    await repo.completeWorkout(getPlanWorkouts(original)[0].id)
    const tracked = await repo.getPlan()
    const next = await repo.startNewPlan()
    expect(next.id).not.toBe(original.id)
    expect(await repo.getArchivedPlans()).toEqual([{ ...tracked, status: 'archived' }])
    expect(getPlanWorkouts(next).every((workout) => workout.status === 'planned')).toBe(true)
    const oldIds = new Set(getPlanWorkouts(original).map((workout) => workout.id))
    expect(getPlanWorkouts(next).every((workout) => !oldIds.has(workout.id))).toBe(true)
  })

  it('reports an expired plan instead of regenerating it', async () => {
    const context = setup()
    const original = await context.repo.getPlan()
    context.setNow(new Date('2026-12-01T10:00:00Z'))
    expect(await context.repo.getUpdateReason()).toBe('finished')
    expect(await context.repo.getPlan()).toEqual(original)
  })

  it('does not persist failed mutations and allows a subsequent retry', async () => {
    const context = setup()
    const original = await context.repo.getPlan()
    const workoutId = getPlanWorkouts(original)[0].id
    context.setFailure(true)
    await expect(context.repo.completeWorkout(workoutId)).rejects.toThrow('disk_full')
    expect(await context.repo.getPlan()).toEqual(original)
    context.setFailure(false)
    await context.repo.completeWorkout(workoutId)
    expect(getPlanWorkouts(await context.repo.getPlan())[0].status).toBe('completed')
  })

  it('rejects an unknown session or invalid move without changing the calendar', async () => {
    const { repo } = setup()
    const original = await repo.getPlan()
    await expect(repo.skipWorkout('missing')).rejects.toThrow('workout_not_found')
    await expect(
      repo.moveWorkout(getPlanWorkouts(original)[0].id, new Date('invalid')),
    ).rejects.toThrow()
    expect(await repo.getPlan()).toEqual(original)
  })

  it('does not move or skip a completed session', async () => {
    const { repo } = setup()
    const workoutId = getPlanWorkouts(await repo.getPlan())[0].id
    const completed = await repo.completeWorkout(workoutId)
    await expect(repo.moveWorkout(workoutId, new Date())).rejects.toThrow('workout_already_tracked')
    expect(await repo.completeWorkout(workoutId)).toEqual(completed)
  })
})
