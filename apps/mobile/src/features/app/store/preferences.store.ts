import { create } from 'zustand'

import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type AppearancePreference,
  type LanguagePreference,
  type Preferences,
} from '@/services/preferences/preferences.persistence'

type PreferencesState = Preferences & {
  hydrated: boolean

  setLanguage: (language: LanguagePreference) => void
  setAppearance: (appearance: AppearancePreference) => void
  setSessionReminder: (sessionReminder: boolean) => void
  setWeeklySummary: (weeklySummary: boolean) => void
  setInactivityNudge: (inactivityNudge: boolean) => void
  setReminderTime: (reminderHour: number, reminderMinute: number) => void
  setCelebrated: (goalKey: string, threshold: number) => void
  hydrate: () => Promise<void>
}

const initialState = { ...defaultPreferences, hydrated: false }

/**
 * Writes every preference, not the two this store happens to have setters for.
 *
 * `savePreferences` replaces the whole record. Writing only the fields the
 * store knows about would reset the rest to their defaults the next time the
 * rider switched language — silently, and only for riders who had changed
 * something.
 */
function persist(state: PreferencesState): void {
  if (!state.hydrated) {
    return
  }

  void savePreferences({
    language: state.language,
    appearance: state.appearance,
    sessionReminder: state.sessionReminder,
    reminderHour: state.reminderHour,
    reminderMinute: state.reminderMinute,
    weeklySummary: state.weeklySummary,
    inactivityNudge: state.inactivityNudge,
    celebratedThresholds: state.celebratedThresholds,
  })
}

/**
 * The two choices that outlive a screen: language and appearance.
 *
 * In a store rather than in the components that read them, because the readers
 * are not all components — the tab bar, the map style and the bundle of
 * `date-fns` all need the answer, and threading a value through every screen
 * between them and the setting would be the whole app passing a note.
 *
 * It has to be reactive rather than a module-level variable: the React Compiler
 * is on, and it will happily memoise a value it believes cannot change between
 * renders. Subscribing is what makes switching the language redraw the screen.
 */
export const usePreferencesStore = create<PreferencesState>((set) => ({
  ...initialState,

  setLanguage: (language) => {
    set((state) => {
      const next = { ...state, language }
      persist(next)
      return next
    })
  },

  setAppearance: (appearance) => {
    set((state) => {
      const next = { ...state, appearance }
      persist(next)
      return next
    })
  },

  setSessionReminder: (sessionReminder) => {
    set((state) => {
      const next = { ...state, sessionReminder }
      persist(next)
      return next
    })
  },

  setWeeklySummary: (weeklySummary) => {
    set((state) => {
      const next = { ...state, weeklySummary }
      persist(next)
      return next
    })
  },

  setInactivityNudge: (inactivityNudge) => {
    set((state) => {
      const next = { ...state, inactivityNudge }
      persist(next)
      return next
    })
  },

  setReminderTime: (reminderHour, reminderMinute) => {
    set((state) => {
      const next = { ...state, reminderHour, reminderMinute }
      persist(next)
      return next
    })
  },

  /**
   * Records the highest milestone announced for a goal.
   *
   * The highest rather than the latest: progress can go down — a goal edited
   * upward — and a rider who has already been told about 50 % should not hear
   * about it a second time on the way back up.
   */
  setCelebrated: (goalKey, threshold) => {
    set((state) => {
      const next = {
        ...state,
        celebratedThresholds: {
          ...state.celebratedThresholds,
          [goalKey]: Math.max(state.celebratedThresholds[goalKey] ?? 0, threshold),
        },
      }
      persist(next)
      return next
    })
  },

  hydrate: async () => {
    const stored = await loadPreferences()
    set({ ...stored, hydrated: true })
  },
}))
