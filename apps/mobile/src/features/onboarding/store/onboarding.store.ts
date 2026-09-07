import { create } from 'zustand'

import type { WeeklyAvailabilityForm } from '../domain/availability.schema'
import type { StravaConnection } from '../domain/strava.schema'
import type { CyclistGoalForm } from '../domain/goal.schema'
import type { CyclistProfileForm } from '../domain/profile.schema'

type OnboardingState = {
  profile: CyclistProfileForm | null
  goal: CyclistGoalForm | null
  availability: WeeklyAvailabilityForm | null
  strava: StravaConnection | null

  setProfile: (profile: CyclistProfileForm) => void
  setGoal: (goal: CyclistGoalForm) => void
  setAvailability: (availability: WeeklyAvailabilityForm) => void
  setStrava: (strava: StravaConnection) => void

  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  profile: null,
  goal: null,
  availability: null,
  strava: null,

  setProfile: (profile) => {
    set({ profile })
  },

  setGoal: (goal) => {
    set({ goal })
  },

  setAvailability: (availability) => {
    set({ availability })
  },

  setStrava: (strava) => {
    set({ strava })
  },

  reset: () => {
    set({
      profile: null,
      goal: null,
      availability: null,
      strava: null,
    })
  },
}))
