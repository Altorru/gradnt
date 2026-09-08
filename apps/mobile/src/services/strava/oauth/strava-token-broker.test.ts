import { describe, expect, it, vi } from 'vitest'

import { connectStrava } from './strava-token-broker'
import type { StravaTokenBroker } from './strava-token-broker'
import type { StravaCallbackResult } from './strava-callback'

function fakeBroker(): StravaTokenBroker {
  const exchangeCode = vi.fn(async (code: string) => ({
    athleteId: 'athlete-123',
    displayName: 'Rider One',
    grantedScopes: ['profile:read_all', 'activity:read_all'] as const,
  }))
  return { exchangeCode }
}

describe('connectStrava', () => {
  it('passes the validated code to the injected broker exactly once', async () => {
    const broker = fakeBroker()
    const success = {
      status: 'success' as const,
      code: 'code-abc',
      grantedScopes: ['profile:read_all', 'activity:read_all'] as const,
    }

    await connectStrava(success, broker)

    expect(broker.exchangeCode).toHaveBeenCalledTimes(1)
    expect(broker.exchangeCode).toHaveBeenCalledWith('code-abc')
  })

  it('returns the normalized connection from the broker', async () => {
    const broker = fakeBroker()
    const success = {
      status: 'success' as const,
      code: 'code-abc',
      grantedScopes: ['profile:read_all', 'activity:read_all'] as const,
    }

    const connection = await connectStrava(success, broker)

    expect(connection).toEqual({
      athleteId: 'athlete-123',
      displayName: 'Rider One',
      grantedScopes: ['profile:read_all', 'activity:read_all'],
    })
  })

  it('does not require any Strava secret or token in the Core', async () => {
    const broker: StravaTokenBroker = {
      exchangeCode: async () => ({
        athleteId: 'athlete-123',
        grantedScopes: ['profile:read_all'],
      }),
    }
    const success = {
      status: 'success' as const,
      code: 'code-abc',
      grantedScopes: ['profile:read_all'] as const,
    }

    const connection = await connectStrava(success, broker)

    expect(connection).not.toHaveProperty('accessToken')
    expect(connection).not.toHaveProperty('refreshToken')
    expect(connection).not.toHaveProperty('clientSecret')
  })

  it('throws a descriptive error when the callback result is not a success', async () => {
    const broker = fakeBroker()

    const results: StravaCallbackResult[] = [
      { status: 'invalidState' },
      { status: 'missingCode' },
      {
        status: 'insufficientScopes',
        grantedScopes: ['profile:read_all'],
        missingRequiredScopes: ['activity:read_all'],
      },
      { status: 'userDenied', errorDescription: 'denied' },
      { status: 'oauthError', error: 'invalid_grant' },
    ]

    for (const result of results) {
      await expect(connectStrava(result, broker)).rejects.toThrow(
        `Cannot connect to Strava: callback result has status '${result.status}', not 'success'`,
      )
    }

    expect(broker.exchangeCode).not.toHaveBeenCalled()
  })

  it('does not exchange a token when the success code is empty', async () => {
    const broker = fakeBroker()
    const malformed = {
      status: 'success' as const,
      code: '',
      grantedScopes: ['profile:read_all'] as const,
    }

    await expect(connectStrava(malformed, broker)).rejects.toThrow(
      'Cannot connect to Strava: callback result has no authorization code',
    )
    expect(broker.exchangeCode).not.toHaveBeenCalled()
  })
})
