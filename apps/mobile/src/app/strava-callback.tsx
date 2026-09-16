import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { YStack } from 'tamagui'

import { GradntButton, GradntScreen, GradntText } from '@/design-system'
import { translateNow } from '@/i18n'
import { STRAVA_ERROR_KEYS } from '@/features/onboarding/domain/strava.schema'
import { takeStravaCallbackUrl } from '@/services/strava/oauth/strava-callback-url'

import { stravaService } from '../features/onboarding/services/strava.service'
import { useOnboardingStore } from '../features/onboarding/store/onboarding.store'

/**
 * Landing route for the Strava redirect.
 *
 * Reached via `+native-intent.tsx`, which stashes the callback URL and rewrites
 * `gradnt://strava/callback` to this path. The exchange is guarded inside the
 * service: whichever of this route and the pending `beginStravaConnect` call
 * gets there first consumes the pending state, and the other reports `ignored`.
 *
 * A failure is shown here rather than silently redirecting, because the reason
 * is otherwise invisible — the rider just lands back on the Strava screen with
 * nothing to act on.
 */
export default function StravaCallbackScreen() {
  const router = useRouter()
  const setStrava = useOnboardingStore((state) => state.setStrava)
  const [message, setMessage] = useState<string | null>(null)
  const handled = useRef(false)

  useEffect(() => {
    // React 19 may run effects twice in development; an authorization code must
    // only be consumed once.
    if (handled.current) {
      return
    }
    handled.current = true

    void (async () => {
      const callbackUrl = takeStravaCallbackUrl()

      if (!callbackUrl) {
        setMessage(translateNow()('onboarding.strava.errors.readFailed'))
        return
      }

      const result = await stravaService.completeConnect(callbackUrl)

      if (result.ok) {
        setStrava(result.connection)
        router.replace('/onboarding/review')
        return
      }

      // The other delivery path may have completed it first, in which case
      // there is simply nothing left to do here. One check covers it now: the
      // service reads the same persisted store the Strava screen writes to.
      if (useOnboardingStore.getState().strava?.status === 'connected') {
        router.replace('/onboarding/review')
        return
      }

      setMessage(translateNow()(STRAVA_ERROR_KEYS[result.error.code], result.error.params))
    })()
  }, [router, setStrava])

  if (message) {
    return (
      <GradntScreen>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <GradntText weight="semibold">
            {translateNow()('onboarding.strava.errors.interruptedTitle')}
          </GradntText>

          <GradntText muted textAlign="center">
            {message}
          </GradntText>

          <GradntButton onPress={() => router.replace('/onboarding/strava')}>
            {translateNow()('onboarding.strava.errors.backToStrava')}
          </GradntButton>
        </YStack>
      </GradntScreen>
    )
  }

  return (
    <GradntScreen>
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <ActivityIndicator />
        <GradntText muted>{translateNow()('onboarding.strava.errors.connecting')}</GradntText>
      </YStack>
    </GradntScreen>
  )
}
