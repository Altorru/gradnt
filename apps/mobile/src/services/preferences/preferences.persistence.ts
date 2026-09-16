import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { z } from 'zod'

const preferencesStorageKey = 'gradnt.preferences.v1'

/**
 * `system` is a real answer, not a missing one.
 *
 * A rider who has never opened the setting has not chosen French — they have
 * chosen to follow their phone, and the two differ the moment they travel or
 * change the device language. Collapsing them would freeze the app in whatever
 * language happened to be current the first time it launched.
 */
export const languagePreferenceSchema = z.enum(['system', 'fr', 'en'])
export const appearancePreferenceSchema = z.enum(['system', 'light', 'dark'])

export const preferencesSchema = z.object({
  language: languagePreferenceSchema,
  appearance: appearancePreferenceSchema,

  // Flat, each with its own default. A nested object would need `.default({...})`
  // to spell out every value again: zod returns a default without reparsing it,
  // so the inner defaults would never run.
  sessionReminder: z.boolean().default(true),
  reminderHour: z.number().int().min(0).max(23).default(7),
  reminderMinute: z.number().int().min(0).max(59).default(0),
  weeklySummary: z.boolean().default(true),
  inactivityNudge: z.boolean().default(false),
})

export type LanguagePreference = z.infer<typeof languagePreferenceSchema>
export type AppearancePreference = z.infer<typeof appearancePreferenceSchema>
export type Preferences = z.infer<typeof preferencesSchema>

export const defaultPreferences: Preferences = {
  language: 'system',
  appearance: 'system',
  sessionReminder: true,
  reminderHour: 7,
  reminderMinute: 0,
  weeklySummary: true,
  inactivityNudge: false,
}

async function readStoredValue(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(preferencesStorageKey)
  }

  return SecureStore.getItemAsync(preferencesStorageKey)
}

async function writeStoredValue(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(preferencesStorageKey, value)
    }

    return
  }

  await SecureStore.setItemAsync(preferencesStorageKey, value)
}

/** The rider's choices, or the defaults when nothing is stored or it is unreadable. */
export async function loadPreferences(): Promise<Preferences> {
  try {
    const storedValue = await readStoredValue()

    if (!storedValue) {
      return defaultPreferences
    }

    const result = preferencesSchema.safeParse(JSON.parse(storedValue))
    return result.success ? result.data : defaultPreferences
  } catch {
    return defaultPreferences
  }
}

export async function savePreferences(preferences: Preferences): Promise<void> {
  await writeStoredValue(JSON.stringify(preferencesSchema.parse(preferences)))
}
