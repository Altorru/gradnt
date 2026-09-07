import { create } from 'zustand'

import type { CyclistGoalForm } from '../domain/goal.schema'
import type { CyclistProfileForm } from '../domain/profile.schema'

type OnboardingState = {
  profile: CyclistProfileForm | null
  goal: CyclistGoalForm | null

  setProfile: (profile: CyclistProfileForm) => void
  setGoal: (goal: CyclistGoalForm) => void

  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  profile: null,
  goal: null,

  setProfile: (profile) => {
    set({ profile })
  },

  setGoal: (goal) => {
    set({ goal })
  },

  reset: () => {
    set({
      profile: null,
      goal: null,
    })
  },
}))
