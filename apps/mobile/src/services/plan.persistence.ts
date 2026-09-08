import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'

const planOverridesStorageKey = 'gradnt.plan.overrides.v1'

export const planOverrideSchema = z.object({
  workoutId: z.string(),
  status: z.enum(['planned', 'completed', 'skipped', 'moved']),
  date: z.string().datetime().nullable(),
})

export const planOverridesSchema = z.array(planOverrideSchema)

export type PlanOverride = z.infer<typeof planOverrideSchema>

async function readStoredValue(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(planOverridesStorageKey)
  }

  return SecureStore.getItemAsync(planOverridesStorageKey)
}

async function writeStoredValue(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(planOverridesStorageKey, value)
    }

    return
  }

  await SecureStore.setItemAsync(planOverridesStorageKey, value)
}

export async function loadPlanOverrides(): Promise<PlanOverride[]> {
  try {
    const storedValue = await readStoredValue()

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    const result = planOverridesSchema.safeParse(parsedValue)
    return result.success ? result.data : []
  } catch {
    return []
  }
}

export async function savePlanOverrides(overrides: PlanOverride[]): Promise<void> {
  await writeStoredValue(JSON.stringify(planOverridesSchema.parse(overrides)))
}

export async function clearPlanOverrides(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(planOverridesStorageKey)
    }

    return
  }

  await SecureStore.deleteItemAsync(planOverridesStorageKey)
}
