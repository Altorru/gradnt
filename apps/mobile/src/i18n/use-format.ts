import { dateLocale, formatNumber } from './format'
import { useAppLanguage } from './use-app-language'

/**
 * The formatters, in the language the app is currently in.
 *
 * Split from `format.ts` so that file stays free of hooks: the domain modules
 * that word a notification import `formatNumber` directly, and they must not
 * drag `expo-localization` and the preferences store along with them.
 */
export function useDateLocale() {
  return dateLocale(useAppLanguage())
}

export function useNumberFormat(): (value: number, options?: Intl.NumberFormatOptions) => string {
  const language = useAppLanguage()

  return (value, options) => formatNumber(language, value, options)
}
