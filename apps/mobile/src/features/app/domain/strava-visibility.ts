import type { Activity } from '@/lib/domain'

export function hasStravaActivity(activities: Pick<Activity, 'source'>[]): boolean {
  return activities.some((activity) => activity.source === 'strava')
}

export function shouldShowStravaConnect(input: {
  hydrated: boolean
  connected: boolean
  activitiesReady: boolean
  activities: Pick<Activity, 'source'>[]
}): boolean {
  return (
    input.hydrated &&
    input.activitiesReady &&
    !input.connected &&
    !hasStravaActivity(input.activities)
  )
}
