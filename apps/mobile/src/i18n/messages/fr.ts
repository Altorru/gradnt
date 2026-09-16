/**
 * The reference catalogue.
 *
 * French is the source of truth for the *shape* because it is the language the
 * app was written in: every key here has a sentence a person already wrote, so
 * `en` is a translation of something real rather than of a placeholder. `en` is
 * typed against this file, which makes a missing or extra key a compile error
 * instead of a French sentence surfacing in an English screen.
 *
 * Keys are nested by where they appear, not by what they are.
 */
export const fr = {
  common: {
    ok: 'OK',
    cancel: 'Annuler',
    retry: 'Réessayer',
    back: 'Revenir en arrière',
    closePanel: 'Fermer le panneau',
    openMenu: 'Ouvrir {{label}}',
  },

  tabs: {
    home: 'Accueil',
    plan: 'Plan',
    progress: 'Progrès',
    explore: 'Explorer',
    garage: 'Garage',
  },

  settings: {
    title: 'Réglages',
    appearanceAndLanguage: 'APPARENCE ET LANGUE',
    theme: 'Thème',
    /** `system` is a choice, so it is named like one in both catalogues. */
    themeSystem: 'Système',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    language: 'Langue',
    languageSystem: 'Système',
  },

  /**
   * The two language names are not translated, and that is deliberate.
   *
   * A language is listed in its own language, so the one a rider needs is
   * readable even when the screen is in the other one — "French" is no help to
   * someone who cannot read English.
   */
  languages: {
    fr: 'Français',
    en: 'English',
  },

  plan: {
    /**
     * A plural pair, not a sentence with an `s` glued on.
     *
     * `{{count}}` is interpolated by the plural lookup, so the number and the
     * word agree in whatever language is active — French counts zero as
     * singular, English does not.
     */
    completed: {
      one: '{{count}} terminée',
      other: '{{count}} terminées',
    },
    upcoming: '{{count}} à venir',
  },

  progress: {
    ridesThisWeek: {
      one: '{{count}} sortie cette semaine',
      other: '{{count}} sorties cette semaine',
    },
  },
}
