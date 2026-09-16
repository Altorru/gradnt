import { useMemo } from 'react'

import { usePreferencesStore } from '@/features/app/store/preferences.store'

import { resolveLanguage, type Language } from './languages'
import {
  translate,
  translatePlural,
  type MessageKey,
  type PluralKey,
  type Translate,
  type TranslateParams,
} from './translate'
import { deviceLanguage, useAppLanguage } from './use-app-language'

export { resolveLanguage, SUPPORTED_LANGUAGES, type Language } from './languages'
export { translate, translatePlural } from './translate'
export type {
  MessageKey,
  Messages,
  PluralKey,
  PluralMessage,
  Translate,
  TranslateParams,
} from './translate'
export { deviceLanguage, useAppLanguage } from './use-app-language'
export { dateLocale, formatNumber } from './format'
export { useDateLocale, useNumberFormat } from './use-format'

/**
 * What a screen gets from `useTranslation()`.
 *
 * Exported because domain modules that build a sentence — not just a label —
 * take it as an argument, the same way the label maps take `Translate`.
 */
export type Translation = {
  t: Translate
  plural: (key: PluralKey, count: number, params?: TranslateParams) => string
}

/**
 * The translator for a screen.
 *
 * Reading the language through the store is what makes switching it in Settings
 * redraw everything: the subscription *is* the re-render. It also keeps this
 * safe under the React Compiler, which would otherwise be free to memoise a
 * value read from a module.
 */
export function useTranslation(): Translation {
  const language = useAppLanguage()

  return useMemo(
    () => ({
      t: (key: MessageKey, params?: TranslateParams) => translate(language, key, params),
      plural: (key: PluralKey, count: number, params?: TranslateParams) =>
        translatePlural(language, key, count, params),
    }),
    [language],
  )
}

/**
 * The translator outside a render, for event handlers and loaders.
 *
 * Reads the store rather than subscribing, because there is no render to
 * invalidate. Never call this from a component body — under the React Compiler
 * the result would be memoised and would never change with the language.
 */
export function translateNow(): Translate {
  const language: Language = resolveLanguage(
    usePreferencesStore.getState().language,
    deviceLanguage(),
  )

  return (key, params) => translate(language, key, params)
}
