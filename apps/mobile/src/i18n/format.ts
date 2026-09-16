import type { Locale } from 'date-fns'
import { enUS, fr as frLocale } from 'date-fns/locale'

import type { Language } from './languages'

/**
 * Pure formatters, deliberately: nothing here is a hook.
 *
 * The domain module that words a notification takes a language and formats with
 * it directly, so reaching this file must not load `expo-localization` or the
 * preferences store — the domain half is tested with no device attached, and a
 * module that only ever runs in Node has no business importing a native one.
 * The hooks that read the active language live in `use-format.ts`.
 *
 * `date-fns` locales are keyed by the app's languages: the screens used to
 * import `fr` from `date-fns` directly and hand it to every formatter, so an
 * English screen still dated its workouts in French. The locale is a function of
 * the active language now, like every other piece of copy.
 */
const DATE_LOCALES: Record<Language, Locale> = { fr: frLocale, en: enUS }

export function dateLocale(language: Language): Locale {
  return DATE_LOCALES[language]
}

const numberFormatters = new Map<string, Intl.NumberFormat>()

function formatterFor(language: Language, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = `${language}|${JSON.stringify(options)}`
  const cached = numberFormatters.get(key)

  if (cached) {
    return cached
  }

  const formatter = new Intl.NumberFormat(language, options)
  numberFormatters.set(key, formatter)
  return formatter
}

/**
 * A figure a rider reads, in the shape their language writes numbers.
 *
 * Replaces the `toFixed(1)` and manual unit concatenation the screens do today,
 * where the decimal separator is a dot in French and the unit spacing is
 * whatever the string template happened to say.
 */
export function formatNumber(
  language: Language,
  value: number,
  options: Intl.NumberFormatOptions = {},
): string {
  return formatterFor(language, options).format(value)
}
