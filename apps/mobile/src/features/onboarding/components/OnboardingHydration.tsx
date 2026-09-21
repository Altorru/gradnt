import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'

import { useOnboardingStore } from '../store/onboarding.store'
import { reconcileStoredStravaConnection } from '@/services/strava/strava-connection.service'
import { migrateLegacyFtpHistoryToCloud } from '@/services/ftp/ftp.persistence'

export function OnboardingHydration({ children }: PropsWithChildren) {
  const hydrate = useOnboardingStore((state) => state.hydrate)

  useEffect(() => {
    void hydrate()
      .then(async () => {
        await reconcileStoredStravaConnection()
        await migrateLegacyFtpHistoryToCloud()
      })
      .catch(() => undefined)
  }, [hydrate])

  return children
}
