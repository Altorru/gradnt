import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'

import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import { getSupabaseClient } from '@/services/supabase/client'
import { clearDeviceStravaConnection } from '@/features/onboarding/services/onboarding.persistence'
import { unregisterPushDevices } from '@/services/notifications/push-registration'
import { enqueueAuthTransition } from '@/services/auth/auth-transition'
import { useAppLanguage, useTranslation } from '@/i18n'
import { expoScheduler, reconcile } from '@/services/notifications/notification.scheduler'
import {
  clearStravaTokens,
  clearPendingStravaState,
} from '@/services/strava/oauth/strava-token.persistence'
import { clearFtpHistory, migrateLegacyFtpHistoryToCloud } from '@/services/ftp/ftp.persistence'

export function AuthLifecycle() {
  const queryClient = useQueryClient()
  const translation = useTranslation()
  const language = useAppLanguage()
  useEffect(() => {
    const client = getSupabaseClient()
    if (!client) return
    let userId: string | null | undefined
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      const nextId = session?.user.id ?? null
      const previousId = userId
      const changed = userId !== undefined && userId !== nextId
      userId = nextId
      if (!changed) return
      // Do not call Supabase auth methods while its event callback holds the lock.
      void enqueueAuthTransition(async () => {
        if (userId !== nextId) return
        useOnboardingStore.setState({
          profile: null,
          goal: null,
          availability: null,
          strava: null,
          completed: false,
          currentStep: 1,
          cloud: undefined,
          hydrated: false,
        })
        await queryClient.cancelQueries()
        queryClient.clear()
        if (Platform.OS !== 'web') {
          await reconcile([], translation, language, expoScheduler).catch(() => undefined)
        }
        // The first GRADNT sign-in must keep a Strava grant obtained during
        // onboarding so it can be verified and linked to the new account.
        // Switching away from an existing account must still erase it.
        if (previousId) await clearStravaTokens()
        if (previousId) await clearFtpHistory()
        await clearPendingStravaState()
        if (previousId) await unregisterPushDevices()
        if (previousId) await clearDeviceStravaConnection(previousId)
        if (userId !== nextId) return
        await useOnboardingStore.getState().hydrate()
        if (nextId) await migrateLegacyFtpHistoryToCloud()
      }).catch(() => useOnboardingStore.setState({ hydrated: true, persistenceError: true }))
    })
    const refresh = (state: string) => {
      if (Platform.OS === 'web') return
      if (state === 'active') client.auth.startAutoRefresh()
      else client.auth.stopAutoRefresh()
    }
    refresh(AppState.currentState)
    const listener = AppState.addEventListener('change', (state) => {
      refresh(state)
      if (state === 'active') {
        void queryClient.invalidateQueries({
          predicate: (query) =>
            [
              'activities',
              'training-metrics',
              'goal-current-value',
              'ride-feedback',
              'training-plan',
              'upcoming-workouts',
              'training-plan-update',
              'training-plan-history',
            ].includes(String(query.queryKey[0])),
        })
      }
    })
    return () => {
      subscription.unsubscribe()
      listener.remove()
      client.auth.stopAutoRefresh()
    }
  }, [queryClient, translation, language])
  return null
}
