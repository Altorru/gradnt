import { useEffect, useMemo } from 'react'
import { AppState, Platform } from 'react-native'

import { useAppLanguage, useTranslation } from '@/i18n'
import { planNotifications } from '@/lib/domain/notification-plan'
import { getGoalProgressPercentage } from '@/lib/domain/selectors'
import {
  ensureChannels,
  expoScheduler,
  reconcile,
} from '@/services/notifications/notification.scheduler'

import {
  useActivitiesQuery,
  useCurrentGoalValueQuery,
  useGoalQuery,
  useUpcomingWorkoutsQuery,
} from '@/hooks/use-gradnt-data'

import {
  goalProgress,
  latestActivityAt,
  syncFingerprint,
  weeklySummaryFrom,
} from '../domain/notification-sync'
import { usePreferencesStore } from '../store/preferences.store'

/**
 * Keeps what is scheduled in step with the rider's plan and preferences.
 *
 * Mounted once at the app root and left running. Five things can change the
 * answer — a workout moving, a fresh sync, a preference, the language, and
 * returning to the foreground — and all five funnel into one effect, because
 * two effects do not share a scope and the milestone bookkeeping needs both the
 * plan and what was actually scheduled.
 */
export function useNotificationSync(): void {
  const translation = useTranslation()
  const language = useAppLanguage()
  const preferences = usePreferencesStore()
  const setCelebrated = usePreferencesStore((state) => state.setCelebrated)

  const activitiesQuery = useActivitiesQuery()
  const workoutsQuery = useUpcomingWorkoutsQuery()
  const goalQuery = useGoalQuery()
  const currentValueQuery = useCurrentGoalValueQuery()

  // Memoised because the empty fallback is a new array every render, and the
  // effect below would restart on each one.
  const activities = useMemo(() => activitiesQuery.data ?? [], [activitiesQuery.data])
  const workouts = useMemo(() => workoutsQuery.data ?? [], [workoutsQuery.data])
  const goal = goalQuery.data ?? null
  const progress =
    goal === null ? 0 : getGoalProgressPercentage(goal, currentValueQuery.data?.value ?? null)

  /**
   * TanStack Query already records when it last read successfully, so the
   * freshness rule needs no storage of its own.
   */
  const lastSyncedAt = activitiesQuery.dataUpdatedAt
    ? new Date(activitiesQuery.dataUpdatedAt).toISOString()
    : null

  // The mapped array is new on every render, which is exactly why the effect
  // depends on a string rather than on it.
  const fingerprint = syncFingerprint({
    workouts: workouts.map((workout) => ({ id: workout.id, status: workout.status })),
    lastSyncedAt: activitiesQuery.dataUpdatedAt,
    preferences,
    language,
  })

  useEffect(() => {
    if (Platform.OS === 'web') {
      return
    }

    const run = async () => {
      // Without hydrated preferences the first pass would schedule the defaults
      // and only correct itself a beat later.
      if (!preferences.hydrated) {
        return
      }

      const now = new Date()

      // A channel has to exist before Android 13 will deliver anything into it.
      await ensureChannels(translation)

      const desired = planNotifications({
        workouts,
        preferences,
        lastActivityAt: latestActivityAt(activities),
        lastSyncedAt,
        weeklySummary: weeklySummaryFrom(activities),
        goal: goalProgress(goal, progress),
        celebrated: preferences.celebratedThresholds,
        now,
      })

      await reconcile(desired, translation, language, expoScheduler)

      // Remembered only once it has actually been scheduled, so a reconcile
      // that failed does not silently swallow the milestone.
      for (const notification of desired) {
        if (notification.kind === 'milestone' && notification.fireAt <= now) {
          setCelebrated(goal?.type ?? 'unknown', notification.threshold)
        }
      }
    }

    void run()

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void run()
      }
    })

    return () => subscription.remove()
  }, [
    fingerprint,
    translation,
    language,
    workouts,
    activities,
    goal,
    progress,
    lastSyncedAt,
    preferences,
    setCelebrated,
  ])
}
