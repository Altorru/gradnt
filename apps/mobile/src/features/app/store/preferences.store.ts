import { create } from 'zustand'

import {
  defaultPreferences,
  loadPreferences,
  savePreferences,
  type AppearancePreference,
  type LanguagePreference,
} from '@/services/preferences/preferences.persistence'

type PreferencesState = {
  language: LanguagePreference
  appearance: AppearancePreference
  hydrated: boolean

  setLanguage: (language: LanguagePreference) => void
  setAppearance: (appearance: AppearancePreference) => void
  hydrate: () => Promise<void>
}

const initialState = { ...defaultPreferences, hydrated: false }

function persist(state: PreferencesState): void {
  if (!state.hydrated) {
    return
  }

  void savePreferences({ language: state.language, appearance: state.appearance })
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

  hydrate: async () => {
    const stored = await loadPreferences()
    set({ ...stored, hydrated: true })
  },
}))
