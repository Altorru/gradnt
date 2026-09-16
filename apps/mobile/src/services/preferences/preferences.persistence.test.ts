import { describe, expect, it, vi } from 'vitest'

import { defaultPreferences, preferencesSchema } from './preferences.persistence'

// Hoisted above the import by vitest, so the module under test sees the stubs.
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}))

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
}))

describe('preferencesSchema', () => {
  it('reads preferences stored before notifications existed', () => {
    // Exactly what an installed app has on disk today: two keys, no more.
    const stored = JSON.stringify({ language: 'en', appearance: 'light' })

    const result = preferencesSchema.safeParse(JSON.parse(stored))

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ language: 'en', appearance: 'light' })
  })

  it('gives the new fields their defaults rather than undefined', () => {
    const result = preferencesSchema.parse({ language: 'fr', appearance: 'dark' })

    expect(result.sessionReminder).toBe(true)
    expect(result.reminderHour).toBe(7)
    expect(result.reminderMinute).toBe(0)
    expect(result.weeklySummary).toBe(true)
    expect(result.inactivityNudge).toBe(false)
  })

  it('rejects an hour outside the clock', () => {
    const result = preferencesSchema.safeParse({
      ...defaultPreferences,
      reminderHour: 24,
    })

    expect(result.success).toBe(false)
  })
})
