import { useQuery } from '@tanstack/react-query'

import { defaultRoutePreferences, type RoutePoint, type RoutePreferences } from '../domain'
import { mockRoutingService } from '../services'
import type { RouteRequest } from '../services'

const defaultStart: RoutePoint = {
  latitude: 45.764,
  longitude: 4.835,
  elevationMeters: 171,
}

export function useRouteProposalsQuery(preferences: RoutePreferences = defaultRoutePreferences) {
  const request: RouteRequest = {
    start: defaultStart,
    preferences,
  }

  return useQuery({
    queryKey: ['route-proposals', request],
    queryFn: () => mockRoutingService.getProposals(request),
  })
}
