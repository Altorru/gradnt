import { describe, expect, it } from 'vitest'

import { isStravaScope, requiredScopes } from './strava-scopes'

describe('requiredScopes', () => {
  it('only requests the scopes needed to read the profile/zones and all activities', () => {
    expect(requiredScopes).toEqual(['profile:read_all', 'activity:read_all'])
  })

  it('does not request read_all unless routes, segments or private events are needed', () => {
    expect(requiredScopes).not.toContain('read_all')
  })

  it('contains no duplicate scopes', () => {
    expect(new Set(requiredScopes).size).toBe(requiredScopes.length)
  })
})

describe('isStravaScope', () => {
  it('accepts every official Strava scope', () => {
    const official: string[] = [
      'read',
      'read_all',
      'profile:read_all',
      'profile:write',
      'activity:read',
      'activity:read_all',
      'activity:write',
    ]

    for (const scope of official) {
      expect(isStravaScope(scope)).toBe(true)
    }
  })

  it('rejects invalid scopes', () => {
    const invalid: string[] = ['profile:readonly', 'profile:all', 'activity:readonly', 'nope']

    for (const scope of invalid) {
      expect(isStravaScope(scope)).toBe(false)
    }
  })
})
