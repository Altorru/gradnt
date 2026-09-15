import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { YStack } from 'tamagui'

import { GradntButton, GradntScreen, GradntText } from '@/design-system'
import { takeStravaCallbackUrl } from '@/services/strava/oauth/strava-callback-url'

import { stravaService } from '../features/onboarding/services/strava.service'
import { useOnboardingStore } from '../features/onboarding/store/onboarding.store'

/**
 * Landing route for the Strava redirect.
 *
 * Reached via `+native-intent.tsx`, which stashes the callback URL and rewrites
 * `mobile://strava/callback` to this path. The exchange is guarded inside the
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
        setMessage("La réponse de Strava n'a pas pu être lue.")
        return
      }

      const result = await stravaService.completeConnect(callbackUrl)

      if (result.ok) {
        setStrava(result.connection)
        router.replace('/onboarding/review')
        return
      }

      // The other delivery path may have completed it first, in which case
      // there is simply nothing left to do here. The service is checked before
      // the store because it records the connection synchronously, while the
      // store write happens on the Strava screen.
      const serviceConnection = await stravaService.getConnection()

      if (
        serviceConnection.status === 'connected' ||
        useOnboardingStore.getState().strava?.status === 'connected'
      ) {
        router.replace('/onboarding/review')
        return
      }

      setMessage(result.error.message)
    })()
  }, [router, setStrava])

  if (message) {
    return (
      <GradntScreen>
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$4">
          <GradntText weight="semibold">Connexion interrompue</GradntText>

          <GradntText muted textAlign="center">
            {message}
          </GradntText>

          <GradntButton onPress={() => router.replace('/onboarding/strava')}>Retour</GradntButton>
        </YStack>
      </GradntScreen>
    )
  }

  return (
    <GradntScreen>
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <ActivityIndicator />
        <GradntText muted>Connexion à Strava…</GradntText>
      </YStack>
    </GradntScreen>
  )
}
