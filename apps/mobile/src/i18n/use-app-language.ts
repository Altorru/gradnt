import { getLocales } from 'expo-localization'
import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

import { usePreferencesStore } from '@/features/app/store/preferences.store'

import { resolveLanguage, SUPPORTED_LANGUAGES, type Language } from './languages'

/**
 * The language the device is asking for, as far as we can serve it.
 *
 * `expo-localization` rather than `Intl`, because it is what reports the
 * *per-app* choice a rider made in Settings — and because a phone set to Dutch
 * should get English rather than nothing. Anything we do not translate lands
 * on English.
 */
export function deviceLanguage(): Language {
  const languageCode = getLocales()[0]?.languageCode

  return languageCode && SUPPORTED_LANGUAGES.includes(languageCode)
    ? (languageCode as Language)
    : 'en'
}

/**
 * The language everything renders in.
 *
 * Reactive through the preferences store, which is what makes switching it in
 * Settings redraw the screens rather than wait for a relaunch.
 *
 * The device value is re-read when the app comes back to the foreground because
 * Android lets the system language change underneath a running app. iOS
 * restarts the app instead, where the listener simply never fires.
 */
export function useAppLanguage(): Language {
  const preference = usePreferencesStore((state) => state.language)
  const [device, setDevice] = useState(deviceLanguage)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        setDevice(deviceLanguage())
      }
    })

    return () => subscription.remove()
  }, [])

  return resolveLanguage(preference, device)
}
