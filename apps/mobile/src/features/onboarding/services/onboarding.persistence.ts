import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'
import {
  readCloudDocument,
  writeCloudDocument,
  type CloudMetadata,
} from '@/services/supabase/documents'

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
  currentStep: z.number().int().min(1).max(8),
  completed: z.boolean(),
})

export type OnboardingSnapshot = z.infer<typeof onboardingSnapshotSchema> & {
  cloud?: CloudMetadata
}

export const emptyOnboardingSnapshot: OnboardingSnapshot = {
  profile: null,
  goal: null,
  availability: null,
  strava: null,
  currentStep: 1,
  completed: false,
}

export async function clearDeviceStravaConnection(userId: string): Promise<void> {
  const key = `gradnt.strava.connection.${userId}`
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.localStorage.removeItem(key)
  } else {
    await SecureStore.deleteItemAsync(key)
  }
}

async function readStoredValue(key = onboardingStorageKey): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key)
  }

  return SecureStore.getItemAsync(key)
}

async function writeStoredValue(value: string, key = onboardingStorageKey): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }

    return
  }

  await SecureStore.setItemAsync(key, value)
}

/** The pre-account answers remain on this device while OAuth opens a browser. */
export async function loadLocalOnboardingSnapshot(): Promise<OnboardingSnapshot | null> {
  const storedValue = await readStoredValue()
  if (!storedValue) return null
  try {
    const result = onboardingSnapshotSchema.safeParse(JSON.parse(storedValue))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export async function loadOnboardingSnapshot(): Promise<OnboardingSnapshot | null> {
  const document = await readCloudDocument('onboarding')
  if (document.mode === 'cloud') {
    const snapshot =
      document.value === null
        ? emptyOnboardingSnapshot
        : onboardingSnapshotSchema.parse(document.value)
    const deviceStrava = await readStoredValue(
      `gradnt.strava.connection.${document.metadata.userId}`,
    )
    const strava =
      deviceStrava === null ? null : stravaConnectionSchema.parse(JSON.parse(deviceStrava))
    return { ...snapshot, strava, cloud: document.metadata }
  }
  return loadLocalOnboardingSnapshot()
}

export async function saveOnboardingSnapshot(
  snapshot: OnboardingSnapshot,
): Promise<OnboardingSnapshot> {
  const payload = onboardingSnapshotSchema.parse(snapshot)
  const document = snapshot.cloud ? null : await readCloudDocument('onboarding')
  const metadata = snapshot.cloud ?? (document?.mode === 'cloud' ? document.metadata : undefined)
  if (metadata) {
    if (!snapshot.cloud && document?.mode === 'cloud' && document.value !== null) {
      throw new Error('document_conflict')
    }
    const cloud = await writeCloudDocument('onboarding', { ...payload, strava: null }, metadata)
    if (payload.strava) {
      await writeStoredValue(
        JSON.stringify(payload.strava),
        `gradnt.strava.connection.${cloud.userId}`,
      )
    } else if (Platform.OS === 'web') {
      if (typeof window !== 'undefined')
        window.localStorage.removeItem(`gradnt.strava.connection.${cloud.userId}`)
    } else {
      await SecureStore.deleteItemAsync(`gradnt.strava.connection.${cloud.userId}`)
    }
    return { ...payload, cloud }
  }
  await writeStoredValue(JSON.stringify(payload))
  return payload
}

export async function clearOnboardingSnapshot(): Promise<void> {
  const document = await readCloudDocument('onboarding')
  if (document.mode === 'cloud') {
    await saveOnboardingSnapshot({ ...emptyOnboardingSnapshot, cloud: document.metadata })
    return
  }
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(onboardingStorageKey)
    }

    return
  }

  await SecureStore.deleteItemAsync(onboardingStorageKey)
}
