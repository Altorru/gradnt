import { create } from 'zustand'

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

  setProfile: (profile: CyclistProfileForm) => void
  setGoal: (goal: CyclistGoalForm) => void
  setAvailability: (availability: WeeklyAvailabilityForm) => void
  setStrava: (strava: StravaConnection) => void
  /**
   * Records that the rider got past the notifications step.
   *
   * That step owns no data of its own — the switches write straight to the
   * preferences store — so all this keeps is the resume point. Without it a
   * rider killed on the review screen would come back to Strava.
   */
  setNotificationsSeen: () => void
  complete: () => void
  hydrate: () => Promise<void>
  reset: () => Promise<void>
}

const initialState = {
  profile: null,
  goal: null,
  availability: null,
  strava: null,
  currentStep: 1,
  completed: false,
  hydrated: false,
} satisfies OnboardingSnapshot & { hydrated: boolean }

function persist(state: OnboardingState): void {
  if (!state.hydrated) {
    return
  }

  const snapshot: OnboardingSnapshot = {
    profile: state.profile,
    goal: state.goal,
    availability: state.availability,
    strava: state.strava,
    currentStep: state.currentStep,
    completed: state.completed,
  }

  void saveOnboardingSnapshot(snapshot)
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setProfile: (profile) => {
    set((state) => {
      const nextState = { ...state, profile, currentStep: Math.max(state.currentStep, 2) }
      persist(nextState)
      return nextState
    })
  },

  setGoal: (goal) => {
    set((state) => {
      const nextState = { ...state, goal, currentStep: Math.max(state.currentStep, 3) }
      persist(nextState)
      return nextState
    })
  },

  setAvailability: (availability) => {
    set((state) => {
      const nextState = { ...state, availability, currentStep: Math.max(state.currentStep, 4) }
      persist(nextState)
      return nextState
    })
  },

  setStrava: (strava) => {
    set((state) => {
      const nextState = { ...state, strava, currentStep: Math.max(state.currentStep, 5) }
      persist(nextState)
      return nextState
    })
  },

  setNotificationsSeen: () => {
    set((state) => {
      const nextState = { ...state, currentStep: Math.max(state.currentStep, 6) }
      persist(nextState)
      return nextState
    })
  },

  complete: () => {
    set((state) => {
      const nextState = { ...state, currentStep: 7, completed: true }
      persist(nextState)
      return nextState
    })
  },

  hydrate: async () => {
    const snapshot = await loadOnboardingSnapshot()

    if (snapshot) {
      set({ ...snapshot, hydrated: true })
      return
    }

    set({ hydrated: true })
  },

  reset: async () => {
    await clearOnboardingSnapshot()
    set({ ...initialState, hydrated: true })
  },
}))

export function getOnboardingResumeRoute(
  step: number,
):
  | '/onboarding/profile'
  | '/onboarding/goal'
  | '/onboarding/availability'
  | '/onboarding/strava'
  | '/onboarding/notifications'
  | '/onboarding/review' {
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

  return '/onboarding/review'
}

export function resetOnboardingForDevelopment(): void {
  void useOnboardingStore.getState().reset()
}
