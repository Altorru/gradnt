import type { LanguagePreference } from '@/services/preferences/preferences.persistence'

/**
 * What the app is translated into. Adding one means adding a catalogue.
 */
export type Language = 'fr' | 'en'

/** The languages we actually translate, as opposed to the ones a phone can be set to. */
export const SUPPORTED_LANGUAGES: readonly string[] = ['fr', 'en']

/**
 * The preference, with `system` resolved against the device.
 *
 * Kept pure and apart from the hook that reads the device, so the rule can be
 * tested without a native module — and so this file stays importable from
 * anywhere, including the domain modules that have no React around them.
 */
export function resolveLanguage(preference: LanguagePreference, device: Language): Language {
  return preference === 'system' ? device : preference
}
