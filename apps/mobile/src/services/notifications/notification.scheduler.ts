import * as Notifications from 'expo-notifications'

import { colors } from '@/design-system/tokens/colors'
import type { Language, Translation } from '@/i18n'
import { describeNotification, type DesiredNotification } from '@/lib/domain/notification-plan'

/** Ours, and only ours. Anything without this prefix is left alone. */
export const NOTIFICATION_PREFIX = 'gradnt:'

export type ScheduledSummary = { identifier: string; key: string }

/**
 * The three things we need from expo-notifications, as an interface.
 *
 * Injected rather than imported so the reconciliation — the part where a
 * mistake goes unnoticed for days — can be tested without a device. The real
 * implementation lives in `expoScheduler` below.
 */
export type SchedulerPort = {
  list: () => Promise<ScheduledSummary[]>
  cancel: (identifier: string) => Promise<void>
  schedule: (input: {
    key: string
    title: string
    body: string
    url: string
    fireAt: Date
    channelId: string
  }) => Promise<string>
}

/**
 * Which Android channel each kind belongs to.
 *
 * Only the session reminder is an interruption; everything else is a digest the
 * rider reads when they next look. The channel carries that distinction on
 * Android, `interruptionLevel` on iOS — see the next task, which declares them.
 */
export const CHANNEL_FOR_KIND = {
  session: 'sessions',
  weekly: 'weekly',
  inactivity: 'nudges',
  milestone: 'weekly',
} as const

/**
 * Makes the OS hold exactly what we want, and nothing else.
 *
 * Written against a port rather than `expo-notifications` so the ways this can
 * go quietly wrong — re-scheduling what the OS already holds, dropping a
 * reminder a rider was owed, cancelling one that was never ours — are decisions
 * a test can observe.
 *
 * Idempotent, not deduplicating: identity is the key alone, so a second pass over
 * the same wanted set writes nothing and cancels nothing. Two OS entries carrying
 * one key are both left alone rather than healed — nothing we schedule can
 * produce that, so it is not worth the pass.
 */
export async function reconcile(
  desired: DesiredNotification[],
  translation: Translation,
  language: Language,
  scheduler: SchedulerPort,
): Promise<void> {
  const wanted = new Map(desired.map((notification) => [notification.key, notification]))
  const existing = await scheduler.list()

  // `key` is what we wrote into the notification; the identifier is the OS's.
  // The prefix is the only thing separating our leftovers from the rest of the
  // system's — cancel on anything else and a rider loses a notification that
  // was never ours to take.
  const ours = existing.filter((scheduled) => scheduled.key.startsWith(NOTIFICATION_PREFIX))

  for (const scheduled of ours) {
    if (!wanted.has(scheduled.key.slice(NOTIFICATION_PREFIX.length))) {
      await scheduler.cancel(scheduled.identifier)
    }
  }

  const present = new Set(ours.map((scheduled) => scheduled.key.slice(NOTIFICATION_PREFIX.length)))

  for (const [key, notification] of wanted) {
    if (present.has(key)) {
      continue
    }

    const wording = describeNotification(notification, translation, language)

    await scheduler.schedule({
      key: `${NOTIFICATION_PREFIX}${key}`,
      title: wording.title,
      body: wording.body,
      url: wording.url,
      fireAt: notification.fireAt,
      channelId: CHANNEL_FOR_KIND[notification.kind],
    })
  }
}

/**
 * The real scheduler.
 *
 * The key travels in `content.data`, because `getAllScheduledNotificationsAsync`
 * hands back identifiers the OS chose, not ours. Reading our own key back is
 * what makes the reconciliation exact rather than a cancel-everything.
 */
export const expoScheduler: SchedulerPort = {
  list: async () => {
    const requests = await Notifications.getAllScheduledNotificationsAsync()

    return requests.flatMap((request) => {
      const key = request.content.data?.gradntKey

      return typeof key === 'string' ? [{ identifier: request.identifier, key }] : []
    })
  },

  cancel: (identifier) => Notifications.cancelScheduledNotificationAsync(identifier),

  schedule: ({ key, title, body, url, fireAt, channelId }) =>
    Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { gradntKey: key, url },
        color: colors.lime,
        // 'passive' for the digest, so it lands in the list without lighting the
        // screen: a weekly summary that wakes someone is one they switch off.
        interruptionLevel: channelId === CHANNEL_FOR_KIND.session ? 'active' : 'passive',
      },
      // A `null` trigger means "deliver now", which is what an already-due
      // notification wants: a date trigger in the past would never fire.
      trigger:
        fireAt.getTime() <= Date.now()
          ? null
          : { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fireAt, channelId },
    }),
}
