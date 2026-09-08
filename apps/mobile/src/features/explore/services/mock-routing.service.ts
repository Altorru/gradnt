import { rankRouteProposals, type RouteWithScore } from '../domain'

import type { RouteRequest, RoutingService } from './routing-service'
import { demoRoutes } from './route-fixtures'

export class MockRoutingService implements RoutingService {
  async getProposals(request: RouteRequest): Promise<RouteWithScore[]> {
    const routes = demoRoutes.map((route) => ({
      ...route,
      mode: request.preferences.mode,
    }))

    return rankRouteProposals(routes, request.preferences)
  }
}

export const mockRoutingService = new MockRoutingService()
