import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { OnboardingSnapshot } from '../services/onboarding.persistence'
import { useOnboardingStore } from './onboarding.store'

const persistence = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), clear: vi.fn() }))
vi.mock('../services/onboarding.persistence', () => ({
  loadOnboardingSnapshot: persistence.load,
  saveOnboardingSnapshot: persistence.save,
  clearOnboardingSnapshot: persistence.clear,
}))

describe('onboarding saves', () => {
  beforeEach(async () => {
    persistence.load.mockResolvedValue(null)
    persistence.save.mockImplementation(async (snapshot: OnboardingSnapshot) => snapshot)
    persistence.clear.mockResolvedValue(undefined)
    await useOnboardingStore.getState().hydrate()
  })

  it('serializes profile and goal writes without losing either setting', async () => {
    const profile = { discipline: 'road', experience: 'beginner', weeklyVolume: 'lt3' } as const
    const goal = { type: 'distance', targetValue: '100', eventName: '' } as const
    const store = useOnboardingStore.getState()
    const results = await Promise.all([
      store.setProfile(profile),
      store.setGoal(goal),
      store.setProfile(profile),
    ])
    expect(results).toEqual([true, true, true])
    const saved = persistence.save.mock.calls.at(-1)?.[0]
    expect(saved).toMatchObject({ profile, goal, currentStep: 3 })
    expect(useOnboardingStore.getState()).toMatchObject({ profile, goal, currentStep: 3 })
  })

  it('reports failure and does not announce an unsaved completion', async () => {
    persistence.save.mockRejectedValueOnce(new Error('offline'))
    expect(await useOnboardingStore.getState().complete()).toBe(false)
    expect(useOnboardingStore.getState()).toMatchObject({
      completed: false,
      saving: false,
      persistenceError: true,
    })
    expect(await useOnboardingStore.getState().complete()).toBe(true)
    expect(useOnboardingStore.getState()).toMatchObject({
      completed: true,
      persistenceError: false,
    })
  })

  it('carries the new cloud revision into the next save', async () => {
    persistence.load.mockResolvedValue({
      profile: null,
      goal: null,
      availability: null,
      strava: null,
      currentStep: 1,
      completed: false,
      cloud: { userId: 'owner', revision: 1 },
    })
    await useOnboardingStore.getState().hydrate()
    persistence.save.mockImplementation(async (snapshot: OnboardingSnapshot) => ({
      ...snapshot,
      cloud: { userId: 'owner', revision: (snapshot.cloud?.revision ?? 0) + 1 },
    }))
    await useOnboardingStore.getState().setNotificationsSeen()
    await useOnboardingStore.getState().complete()
    expect(persistence.save.mock.calls.at(-1)?.[0].cloud.revision).toBe(2)
    expect(useOnboardingStore.getState().cloud?.revision).toBe(3)
  })

  it('clears the previous profile when hydration finds an empty workspace', async () => {
    await useOnboardingStore
      .getState()
      .setProfile({ discipline: 'road', experience: 'advanced', weeklyVolume: 'gt10' })
    await useOnboardingStore.getState().hydrate()
    expect(useOnboardingStore.getState()).toMatchObject({ profile: null, completed: false })
  })

  it('keeps settings and reports failure when a restart cannot be saved', async () => {
    const profile = { discipline: 'road', experience: 'regular', weeklyVolume: '3to6' } as const
    await useOnboardingStore.getState().setProfile(profile)
    persistence.clear.mockRejectedValueOnce(new Error('offline'))
    expect(await useOnboardingStore.getState().reset()).toBe(false)
    expect(useOnboardingStore.getState()).toMatchObject({
      profile,
      persistenceError: true,
      saving: false,
    })
  })
})
