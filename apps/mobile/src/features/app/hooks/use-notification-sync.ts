import { useEffect, useMemo } from 'react'
import { AppState, Platform } from 'react-native'

import { useAppLanguage, useTranslation } from '@/i18n'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
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

import { goalProgress, latestActivityAt, syncFingerprint } from '../domain/notification-sync'
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
  const onboardingHydrated = useOnboardingStore((state) => state.hydrated)
  const onboardingCompleted = useOnboardingStore((state) => state.completed)

  /**
   * This hook is mounted at the root, so it runs through the whole onboarding
   * flow — where there is no plan, no goal and no value to derive one from.
   * Reading them there would cache "nothing" for the query client's ten-minute
   * staleTime, and the screens that mount once onboarding ends would read that
   * answer instead of asking. There is also nothing to notify about yet.
   */
  const ready = onboardingHydrated && onboardingCompleted

  const activitiesQuery = useActivitiesQuery({ enabled: ready })
  const workoutsQuery = useUpcomingWorkoutsQuery({ enabled: ready })
  const goalQuery = useGoalQuery({ enabled: ready })
  const currentValueQuery = useCurrentGoalValueQuery({ enabled: ready })

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
    let active = true
    if (Platform.OS === 'web') {
      return
    }

    const run = async () => {
      // Without hydrated preferences the first pass would schedule the defaults
      // and only correct itself a beat later. Without a finished onboarding
      // there is nothing to schedule, and reconciling an empty set would cancel
      // work belonging to a rider who has not started yet.
      if (!preferences.hydrated || !ready) {
        return
      }

      const now = new Date()

      // A channel has to exist before Android 13 will deliver anything into it.
      await ensureChannels(translation)
      if (!active) return

      const desired = planNotifications({
        workouts,
        preferences,
        lastActivityAt: latestActivityAt(activities),
        lastSyncedAt,
        goal: goalProgress(goal, progress),
        celebrated: preferences.celebratedThresholds,
        now,
      })

      await reconcile(desired, translation, language, expoScheduler)
      if (!active) return

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

    return () => {
      active = false
      subscription.remove()
    }
  }, [
    fingerprint,
    translation,
    language,
    ready,
    workouts,
    activities,
    goal,
    progress,
    lastSyncedAt,
    preferences,
    setCelebrated,
  ])
}
