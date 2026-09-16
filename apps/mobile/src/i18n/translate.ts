import type { Language } from './languages'
import { en } from './messages/en'
import { fr } from './messages/fr'

/** The shape every catalogue must have. French defines it; English is checked against it. */
export type Messages = typeof fr

const CATALOGUES: Record<Language, Messages> = { fr, en }

export type TranslateParams = Record<string, string | number>

/** A sentence that changes with a count. */
export type PluralMessage = { one: string; other: string }

type PathsTo<T, Leaf> = {
  [K in keyof T & string]: T[K] extends Leaf
    ? K
    : T[K] extends object
      ? `${K}.${PathsTo<T[K], Leaf>}`
      : never
}[keyof T & string]

/** Every dotted path that lands on a plain sentence. */
export type MessageKey = PathsTo<Messages, string>

/** Every dotted path that lands on a plural pair. */
export type PluralKey = PathsTo<Messages, PluralMessage>

/** A translate function, as handed to the domain modules that build label lists. */
export type Translate = (key: MessageKey, params?: TranslateParams) => string

function lookup(catalogue: Messages, key: string): unknown {
  return key.split('.').reduce<unknown>((node, part) => {
    if (node === null || typeof node !== 'object') {
      return undefined
    }

    return (node as Record<string, unknown>)[part]
  }, catalogue)
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template
  }

  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  )
}

/**
 * The sentence for a key.
 *
 * Falls back to French and then to the key itself. A translation that goes
 * missing shows up as a key on screen, which somebody will notice, rather than
 * as a blank that nobody can trace. The type system makes that path unreachable
 * from a literal key — it exists for keys that arrive as data.
 */
export function translate(language: Language, key: MessageKey, params?: TranslateParams): string {
  const message = lookup(CATALOGUES[language], key) ?? lookup(fr, key)

  return typeof message === 'string' ? interpolate(message, params) : key
}

/**
 * The plural category a count falls into, for the two languages we translate.
 *
 * Hand-written because Hermes does not implement `Intl.PluralRules`. Asking it
 * for one throws "undefined cannot be used as a constructor" — and only on the
 * device: Node has the constructor, so the tests stayed green while every
 * screen calling `plural` died on Android.
 *
 * Both languages are simple on integer counts, which is all this app passes:
 * English singles out 1, and French singles out 0 and 1 — "0 sortie".
 *
 * ponytail: hard-coded to fr/en. A language with real plural rules (Polish,
 * Arabic) means swapping in the `@formatjs/intl-pluralrules` polyfill instead.
 */
function pluralCategory(language: Language, count: number): 'one' | 'other' {
  if (count === 1) {
    return 'one'
  }

  return language === 'fr' && count === 0 ? 'one' : 'other'
}

/**
 * The sentence for a count.
 *
 * A rule per language rather than `count > 1 ? 's' : ''`, because the two do
 * not agree on where the plural starts: French counts zero as singular —
 * "0 sortie" — and a rule read off English would get that wrong.
 */
export function translatePlural(
  language: Language,
  key: PluralKey,
  count: number,
  params?: TranslateParams,
): string {
  const message = lookup(CATALOGUES[language], key) ?? lookup(fr, key)

  if (message === null || typeof message !== 'object') {
    return String(count)
  }

  const forms = message as Record<string, string>
  const form = forms[pluralCategory(language, count)] ?? forms.other ?? String(count)

  return interpolate(form, { ...params, count })
}
