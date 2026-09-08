import { useQuery } from '@tanstack/react-query'
import { Platform } from 'react-native'

import { defaultRoutePreferences, type RoutePoint, type RoutePreferences } from '../domain'
import { heigitRoutingService } from '../adapters'
import { mockRoutingService } from '../services'
import type { RouteRequest } from '../services'

const defaultStart: RoutePoint = {
  latitude: 45.764,
  longitude: 4.835,
  elevationMeters: 171,
}

const routingService =
  Platform.OS !== 'web' && heigitRoutingService.isConfigured()
    ? heigitRoutingService
    : mockRoutingService

export function useRouteProposalsQuery(preferences: RoutePreferences = defaultRoutePreferences) {
  const request: RouteRequest = {
    start: defaultStart,
    preferences,
  }

  return useQuery({
    queryKey: ['route-proposals', request, routingService.constructor.name],
    queryFn: () => routingService.getProposals(request),
  })
}

export function isRealRoutingConfigured() {
  return Platform.OS !== 'web' && heigitRoutingService.isConfigured()
}
