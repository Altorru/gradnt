import { useQuery } from '@tanstack/react-query'
import { Platform } from 'react-native'

import { heigitRoutingService } from '../adapters'
import { defaultRoutePreferences, type RoutePoint, type RoutePreferences } from '../domain'
import { mockRoutingService } from '../services'
import type { RouteRequest } from '../services'
import { defaultRouteStart } from './use-location'

const routingService =
  Platform.OS !== 'web' && heigitRoutingService.isConfigured()
    ? heigitRoutingService
    : mockRoutingService
const routeProposalSeeds = [17, 31, 73] as const

export function useRouteProposalsQuery(
  preferences: RoutePreferences = defaultRoutePreferences,
  start: RoutePoint = defaultRouteStart,
) {
  const request: RouteRequest = {
    start,
    preferences,
  }

  return useQuery({
    queryKey: [
      'route-proposals',
      request.start,
      request.preferences,
      routeProposalSeeds,
      routingService.constructor.name,
    ],
    queryFn: () => routingService.getProposals(request),
  })
}

export function isRealRoutingConfigured() {
  return Platform.OS !== 'web' && heigitRoutingService.isConfigured()
}
