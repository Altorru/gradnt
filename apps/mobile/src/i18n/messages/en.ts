import type { fr } from './fr'

/**
 * Typed against the French catalogue, so the compiler is the checklist: a key
 * added there and forgotten here does not build.
 *
 * Imported from `./fr` rather than from the i18n barrel, so the two catalogues
 * never import each other.
 */
export const en = {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    retry: 'Try again',
    back: 'Go back',
    closePanel: 'Close the panel',
    openMenu: 'Open {{label}}',
  },

  tabs: {
    home: 'Home',
    plan: 'Plan',
    progress: 'Progress',
    explore: 'Explore',
    garage: 'Garage',
  },

  settings: {
    title: 'Settings',
    appearanceAndLanguage: 'APPEARANCE AND LANGUAGE',
    theme: 'Theme',
    themeSystem: 'System',
    themeLight: 'Light',
    themeDark: 'Dark',
    language: 'Language',
    languageSystem: 'System',
  },

  languages: {
    fr: 'Français',
    en: 'English',
  },

  plan: {
    completed: {
      one: '{{count}} completed',
      other: '{{count}} completed',
    },
    upcoming: '{{count}} upcoming',
  },

  progress: {
    ridesThisWeek: {
      one: '{{count}} ride this week',
      other: '{{count}} rides this week',
    },
  },
} satisfies typeof fr
