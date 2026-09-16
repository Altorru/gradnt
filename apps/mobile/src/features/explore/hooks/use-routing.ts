import { useQuery } from '@tanstack/react-query'
import { Platform } from 'react-native'

import { heigitRoutingService } from '../adapters'
import { defaultRoutePreferences, type RoutePoint, type RoutePreferences } from '../domain'

/**
 * Whether real routing is available at all.
 *
 * It needs an API key, and on web the service is not wired up. When it is false
 * there is nothing to ask, and the screen says so — it used to fall back to a
 * mock service, which meant the app quietly answered with invented routes
 * instead of admitting it could not answer.
 */
export function isRealRoutingConfigured(): boolean {
  return Platform.OS !== 'web' && heigitRoutingService.isConfigured()
}

export function useRouteProposalsQuery(
  preferences: RoutePreferences = defaultRoutePreferences,
  start: RoutePoint | null,
) {
  const enabled = start !== null && isRealRoutingConfigured()

  return useQuery({
    // Disabled until there is somewhere to route from, so nothing is fetched
    // speculatively and no placeholder result is ever cached under a real key.
    enabled,
    queryKey: ['route-proposals', start, preferences],
    queryFn: async () => {
      if (start === null) {
        return []
      }

      return heigitRoutingService.getProposals({ start, preferences })
    },
  })
}
