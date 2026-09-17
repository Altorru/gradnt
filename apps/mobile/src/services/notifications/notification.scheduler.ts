import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import { colors } from '@/design-system/tokens/colors'
import type { Language, MessageKey, Translation } from '@/i18n'
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
 * The Android channels, one per kind.
 *
 * The ids are read off `CHANNEL_FOR_KIND` rather than retyped. A channel created
 * under an id the map does not point at is one no notification ever lands in,
 * and Android's fallback for that is silence — no error, no crash.
 *
 * The importance is the interruption the rider gets. Android lets an app change
 * only a channel's name after creation, so what is set here is set for the life
 * of the install — which is the point: the rider can lower it themselves, per
 * channel, in system settings, and that survives everything we do.
 */
const CHANNELS = [
  {
    id: CHANNEL_FOR_KIND.session,
    nameKey: 'notifications.settings.channelSessions',
    importance: Notifications.AndroidImportance.HIGH,
  },
  {
    id: CHANNEL_FOR_KIND.weekly,
    nameKey: 'notifications.settings.channelWeekly',
    importance: Notifications.AndroidImportance.DEFAULT,
  },
  {
    id: CHANNEL_FOR_KIND.inactivity,
    nameKey: 'notifications.settings.channelNudges',
    importance: Notifications.AndroidImportance.LOW,
  },
] as const satisfies readonly {
  id: string
  nameKey: MessageKey
  importance: Notifications.AndroidImportance
}[]

/**
 * Creates the channels, and is safe to call on every launch.
 *
 * Before the permission request, not after: on Android 13 the system prompt does
 * not appear until at least one channel exists. Idempotent by nature — creating
 * a channel that already exists is a no-op — so calling it on every launch costs
 * nothing and needs no state to know whether it has run.
 */
export async function ensureChannels(translation: Translation): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  for (const channel of CHANNELS) {
    await Notifications.setNotificationChannelAsync(channel.id, {
      name: translation.t(channel.nameKey),
      importance: channel.importance,
      lightColor: colors.lime,
    })
  }
}

/**
 * The passes in flight, chained end to end.
 *
 * Serialised rather than run in parallel. Every pass reads the pending list
 * before it writes anything, so two at once both see the desired set missing
 * and both schedule it — three identical alarms for one weekly digest, which a
 * device produces from a single launch. Chaining makes the last pass the one
 * that decides, which is the answer the passes would have agreed on anyway.
 *
 * ponytail: every queued pass still runs. Coalescing to the newest would save
 * native calls during a boot that fires the effect several times, but it would
 * also resolve a caller's promise without having done its work.
 */
let queue: Promise<void> = Promise.resolve()

/**
 * Makes the OS hold exactly what we want, and nothing else.
 *
 * Written against a port rather than `expo-notifications` so the ways this can
 * go quietly wrong — re-scheduling what the OS already holds, dropping a
 * reminder a rider was owed, cancelling one that was never ours — are decisions
 * a test can observe.
 *
 * Idempotent, not deduplicating: identity is the key alone, so a later pass over
 * the same wanted set writes nothing and cancels nothing. Two OS entries
 * carrying one key are left alone rather than healed — this queue is what stops
 * us producing them, not a repair pass.
 */
export function reconcile(
  desired: DesiredNotification[],
  translation: Translation,
  language: Language,
  scheduler: SchedulerPort,
): Promise<void> {
  const pass = queue.then(() => reconcileOnce(desired, translation, language, scheduler))

  // The chain survives a failed pass, or one rejection would wedge every pass
  // after it.
  queue = pass.then(
    () => undefined,
    () => undefined,
  )

  return pass
}

async function reconcileOnce(
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

/**
 * Registered at module scope, not inside a component.
 *
 * A notification that arrives before React mounts is handed to whatever handler
 * exists at that moment — and with none, it is dropped without a word, which is
 * exactly the case a reminder for the ride you are about to leave for falls into.
 *
 * `shouldShowBanner` and `shouldShowList` rather than the old `shouldShowAlert`,
 * which SDK 57 removed: a handler still answering with the old shape shows
 * nothing, and reports nothing.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    // No badge: there is no history, so a count would announce unread things
    // that do not exist.
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})
