import { z } from 'zod'

import { routePointSchema, routePreferencesSchema, type RouteWithScore } from '../domain'

export const routeRequestSchema = z.object({
  start: routePointSchema,
  preferences: routePreferencesSchema,
})

export type RouteRequest = z.infer<typeof routeRequestSchema>

export interface RoutingService {
  getProposals(request: RouteRequest): Promise<RouteWithScore[]>
}

export type RoutingServiceError = {
  code: 'not_configured' | 'network' | 'invalid_response' | 'unknown'
  message: string
}
