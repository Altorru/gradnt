import { z } from 'zod'

import { isStravaScope } from './strava-scopes'
import { saveStravaTokens } from './strava-token.persistence'
import type { StravaConnection, StravaTokenBroker } from './strava-token-broker'

/**
 * Response contract of the `strava-exchange` Edge Function.
 *
 * Validated rather than trusted: the payload crosses a network boundary, and
 * `athleteId` is required because a connection without one is unusable.
 */
const stravaExchangeResponseSchema = z.object({
  athleteId: z.string().min(1),
  displayName: z.string().nullable().optional(),
  grantedScopes: z.array(z.string()),
  tokens: z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    expiresAt: z.string().datetime(),
  }),
})

/**
 * Calls the backend exchange endpoint. The client_secret never leaves the
 * server: this adapter only ever sees the one-time authorization code and the
 * normalized result.
 *
 * Successful exchanges persist their tokens through the token store, because
 * the `StravaTokenBroker` contract exposes only a `StravaConnection` and the
 * tokens would otherwise be lost.
 */
export class HttpStravaTokenBroker implements StravaTokenBroker {
  constructor(private readonly exchangeUrl: string) {}

  async exchangeCode(code: string): Promise<StravaConnection> {
    let response: Response

    try {
      response = await fetch(this.exchangeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
    } catch (error) {
      throw new Error(
        `Cannot connect to Strava: exchange endpoint unreachable (${describe(error)})`,
      )
    }

    if (!response.ok) {
      throw new Error(`Cannot connect to Strava: exchange endpoint returned ${response.status}`)
    }

    const parsed = stravaExchangeResponseSchema.safeParse(await response.json())

    if (!parsed.success) {
      throw new Error('Cannot connect to Strava: exchange endpoint returned an unexpected payload')
    }

    await saveStravaTokens(parsed.data.tokens)

    return {
      athleteId: parsed.data.athleteId,
      displayName: parsed.data.displayName ?? undefined,
      grantedScopes: parsed.data.grantedScopes.filter(isStravaScope),
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error'
}
