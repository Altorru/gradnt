import { describe, expect, it } from 'vitest'

import { requiredScopes } from './strava-scopes'

import { buildAuthorizationUrl } from './strava-config'

const config = {
  clientId: 'client-123',
  redirectUri: 'gradnt://strava/callback',
  authorizationEndpoint: 'https://www.strava.com/oauth/authorize',
  scopes: requiredScopes,
  stateGenerator: () => 'fixed-state',
}

describe('buildAuthorizationUrl', () => {
  it('builds a Strava authorization URL with encoded parameters', () => {
    const url = buildAuthorizationUrl(config)

    const urlObject = new URL(url)
    expect(urlObject.origin + urlObject.pathname).toBe('https://www.strava.com/oauth/authorize')
    expect(urlObject.searchParams.get('client_id')).toBe('client-123')
    expect(urlObject.searchParams.get('redirect_uri')).toBe('gradnt://strava/callback')
    expect(urlObject.searchParams.get('response_type')).toBe('code')
    expect(urlObject.searchParams.get('scope')).toBe('profile:read_all activity:read_all')
    expect(urlObject.searchParams.get('state')).toBe('fixed-state')
  })

  it('uses the injected state generator', () => {
    const calls: string[] = []
    const withCalls = {
      ...config,
      stateGenerator: () => {
        calls.push('invoked')
        return 'generated'
      },
    }

    const url = buildAuthorizationUrl(withCalls)

    expect(new URL(url).searchParams.get('state')).toBe('generated')
    expect(calls).toEqual(['invoked'])
  })
})
