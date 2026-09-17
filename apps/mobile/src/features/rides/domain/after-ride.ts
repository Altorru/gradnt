import type { Activity } from '@/lib/domain'

/** Prompt for one recent, finished ride; historical imports and future dates stay quiet. */
export function getAfterRideActivity(
  activities: readonly Activity[],
  now = new Date(),
): Activity | null {
  const cutoff = now.getTime() - 48 * 60 * 60 * 1000
  let latest: Activity | null = null
  for (const activity of activities) {
    const start = Date.parse(activity.startAt)
    const finish = start + activity.durationSeconds * 1000
    if (start < cutoff || finish > now.getTime() || activity.durationSeconds === 0) continue
    if (latest === null || start > Date.parse(latest.startAt)) latest = activity
  }
  return latest
}
