import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'

import { weeklyAvailabilitySchema } from '../domain/availability.schema'
import { cyclistGoalSchema } from '../domain/goal.schema'
import { cyclistProfileSchema } from '../domain/profile.schema'
import { stravaConnectionSchema } from '../domain/strava.schema'

const onboardingStorageKey = 'gradnt.onboarding.snapshot.v1'

export const onboardingSnapshotSchema = z.object({
  profile: cyclistProfileSchema.nullable(),
  goal: cyclistGoalSchema.nullable(),
  availability: weeklyAvailabilitySchema.nullable(),
  strava: stravaConnectionSchema.nullable(),
  currentStep: z.number().int().min(1).max(6),
  completed: z.boolean(),
})

export type OnboardingSnapshot = z.infer<typeof onboardingSnapshotSchema>

async function readStoredValue(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(onboardingStorageKey)
  }

  return SecureStore.getItemAsync(onboardingStorageKey)
}

async function writeStoredValue(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(onboardingStorageKey, value)
    }

    return
  }

  await SecureStore.setItemAsync(onboardingStorageKey, value)
}

export async function loadOnboardingSnapshot(): Promise<OnboardingSnapshot | null> {
  try {
    const storedValue = await readStoredValue()

    if (!storedValue) {
      return null
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    const result = onboardingSnapshotSchema.safeParse(parsedValue)

    return result.success ? result.data : null
  } catch {
    return null
  }
}

export async function saveOnboardingSnapshot(snapshot: OnboardingSnapshot): Promise<void> {
  await writeStoredValue(JSON.stringify(snapshot))
}

export async function clearOnboardingSnapshot(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(onboardingStorageKey)
    }

    return
  }

  await SecureStore.deleteItemAsync(onboardingStorageKey)
}
