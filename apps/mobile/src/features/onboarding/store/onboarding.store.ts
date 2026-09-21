import { create } from 'zustand'
import type { CloudMetadata } from '@/services/supabase/documents'

import type { WeeklyAvailabilityForm } from '../domain/availability.schema'
import type { CyclistGoalForm } from '../domain/goal.schema'
import type { CyclistProfileForm } from '../domain/profile.schema'
import type { StravaConnection } from '../domain/strava.schema'
import {
  clearOnboardingSnapshot,
  loadOnboardingSnapshot,
  saveOnboardingSnapshot,
  type OnboardingSnapshot,
} from '../services/onboarding.persistence'

type OnboardingState = {
  profile: CyclistProfileForm | null
  goal: CyclistGoalForm | null
  availability: WeeklyAvailabilityForm | null
  strava: StravaConnection | null
  currentStep: number
  completed: boolean
  hydrated: boolean
  cloud?: CloudMetadata
  saving: boolean
  persistenceError: boolean

  setProfile: (profile: CyclistProfileForm) => Promise<boolean>
  setGoal: (goal: CyclistGoalForm) => Promise<boolean>
  setAvailability: (availability: WeeklyAvailabilityForm) => Promise<boolean>
  setStrava: (strava: StravaConnection) => Promise<boolean>
  /**
   * Records that the rider got past the notifications step and is ready to
   * create an account. The review page is kept as a legacy deep link, but is
   * no longer part of the first-run flow.
   *
   * That step owns no data of its own — the switches write straight to the
   * preferences store — so all this keeps is the resume point before the
   * mandatory account step.
   */
  setNotificationsSeen: () => Promise<boolean>
  complete: () => Promise<boolean>
  hydrate: () => Promise<void>
  reset: () => Promise<boolean>
}

const initialState = {
  profile: null,
  goal: null,
  availability: null,
  strava: null,
  currentStep: 1,
  completed: false,
  hydrated: false,
  saving: false,
  persistenceError: false,
} satisfies OnboardingSnapshot & { hydrated: boolean; saving: boolean; persistenceError: boolean }

let pending: Promise<unknown> = Promise.resolve()

export const useOnboardingStore = create<OnboardingState>((set, get) => {
  function update(updates: Partial<OnboardingSnapshot>): Promise<boolean> {
    const result = pending.then(async () => {
      const state = get()
      if (!state.hydrated) return false
      set({ saving: true, persistenceError: false })
      try {
        const saved = await saveOnboardingSnapshot({
          profile: state.profile,
          goal: state.goal,
          availability: state.availability,
          strava: state.strava,
          completed: state.completed,
          cloud: state.cloud,
          ...updates,
          currentStep: Math.max(state.currentStep, updates.currentStep ?? state.currentStep),
        })
        set({ ...saved, saving: false, persistenceError: false })
        return true
      } catch {
        set({ saving: false, persistenceError: true })
        return false
      }
    })
    pending = result.catch(() => undefined)
    return result
  }
  return {
    ...initialState,
    setProfile: (profile) => update({ profile, currentStep: Math.max(get().currentStep, 2) }),
    setGoal: (goal) => update({ goal, currentStep: Math.max(get().currentStep, 3) }),
    setAvailability: (availability) =>
      update({ availability, currentStep: Math.max(get().currentStep, 4) }),
    setStrava: (strava) => update({ strava, currentStep: Math.max(get().currentStep, 5) }),
    setNotificationsSeen: () => update({ currentStep: Math.max(get().currentStep, 8) }),
    complete: () => update({ currentStep: 8, completed: true }),
    hydrate: async () => {
      await pending
      set({ hydrated: false, persistenceError: false })
      try {
        const snapshot = await loadOnboardingSnapshot()
        set({ ...initialState, ...snapshot, cloud: snapshot?.cloud, hydrated: true })
      } catch {
        set({ hydrated: true, persistenceError: true })
      }
    },
    reset: async () => {
      await pending
      set({ saving: true, persistenceError: false })
      try {
        await clearOnboardingSnapshot()
        await get().hydrate()
        return !get().persistenceError
      } catch {
        set({ saving: false, persistenceError: true })
        return false
      }
    },
  }
})

export function getOnboardingResumeRoute(
  step: number,
):
  | '/onboarding/profile'
  | '/onboarding/goal'
  | '/onboarding/availability'
  | '/onboarding/strava'
  | '/onboarding/notifications'
  | '/onboarding/review'
  | '/onboarding/account' {
  if (step <= 2) {
    return '/onboarding/profile'
  }

  if (step === 3) {
    return '/onboarding/goal'
  }

  if (step === 4) {
    return '/onboarding/availability'
  }

  if (step === 5) {
    return '/onboarding/strava'
  }

  if (step === 6) {
    return '/onboarding/notifications'
  }

  return '/onboarding/account'
}

export function resetOnboardingForDevelopment(): void {
  void useOnboardingStore.getState().reset()
}
