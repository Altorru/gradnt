import type { Activity } from '@/lib/domain'

const SOURCE_PRIORITY: Record<Activity['source'], number> = {
  file: 3,
  garmin: 3,
  strava: 2,
  manual: 1,
}

/** A FIT and Strava copy of one ride must count once in goal and load totals. */
export function mergeActivities(...groups: Activity[][]): Activity[] {
  const sorted = groups.flat().sort((left, right) => {
    const priority = SOURCE_PRIORITY[right.source] - SOURCE_PRIORITY[left.source]
    return priority || Date.parse(right.startAt) - Date.parse(left.startAt)
  })
  const chosen: Activity[] = []
  for (const ride of sorted) {
    const duplicate = chosen.some((existing) => {
      if (existing.source === ride.source) return existing.id === ride.id
      const startDelta = Math.abs(Date.parse(existing.startAt) - Date.parse(ride.startAt))
      const distanceDelta = Math.abs(existing.distanceMeters - ride.distanceMeters)
      const durationDelta = Math.abs(existing.durationSeconds - ride.durationSeconds)
      return (
        startDelta <= 120_000 &&
        distanceDelta <= Math.max(500, existing.distanceMeters * 0.02) &&
        durationDelta <= Math.max(300, existing.durationSeconds * 0.1)
      )
    })
    if (!duplicate) chosen.push(ride)
  }
  return chosen.sort((left, right) => Date.parse(right.startAt) - Date.parse(left.startAt))
}
