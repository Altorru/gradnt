import { describe, expect, it, vi } from 'vitest'

import { parseLocalRideDate } from './manual-activity.schema'

describe('manual ride date', () => {
  it('rejects impossible and future local times', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'))
    try {
      expect(parseLocalRideDate('2026-02-31 10:00')).toBeNull()
      expect(parseLocalRideDate('2027-01-01 10:00')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
