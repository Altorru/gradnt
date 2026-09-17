import * as Notifications from 'expo-notifications'
import { describe, expect, it, vi } from 'vitest'

import type { Translation } from '@/i18n'
// The leaf module, not `@/i18n`: the barrel pulls in the preferences store and
// with it expo-secure-store, which this test has no business loading.
import { translate, translatePlural } from '@/i18n/translate'
import type { DesiredNotification } from '@/lib/domain/notification-plan'

import {
  CHANNEL_FOR_KIND,
  ensureChannels,
  reconcile,
  type SchedulerPort,
} from './notification.scheduler'

// Hoisted above the imports by vitest. `expoScheduler` lives in the module
// under test and imports `expo-notifications` at module scope, so without this
// stubbing, importing `reconcile` alone would drag the native module into the
// run. Same class of problem as the `react-native` mock next door.
vi.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  setNotificationChannelAsync: vi.fn(),
  setNotificationHandler: vi.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
  // The real numeric values, so an assertion on an importance is a statement
  // about Android rather than about this stub's spelling.
  AndroidImportance: { LOW: 4, DEFAULT: 5, HIGH: 6 },
  getInitialNotificationResponse: vi.fn(),
  addNotificationResponseReceivedListener: vi.fn(),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: 'granted' }),
}))

// Mutable, so one file can drive both platforms: `ensureChannels` reads
// `Platform.OS` when it is called, and this is the same object it reads.
const platform = vi.hoisted(() => ({ OS: 'ios' as 'ios' | 'android' }))

vi.mock('react-native', () => ({ Platform: platform }))

const translation: Translation = {
  t: (key, params) => translate('fr', key, params),
  plural: (key, count, params) => translatePlural('fr', key, count, params),
}

/**
 * A stand-in for the OS's pending list, and a stateful one.
 *
 * `cancel` forgets, `schedule` remembers, so what the second pass sees is what
 * the first pass actually did. A fake whose `list` returned a fixed closure
 * would make every pass look like the first — and the idempotence this module
 * promises would be untestable rather than merely untested.
 */
function port(initial: { key: string; identifier: string }[] = []) {
  const scheduled = [...initial]
  let nextId = 0

  const cancel = vi.fn(async (identifier: string) => {
    const index = scheduled.findIndex((entry) => entry.identifier === identifier)

    if (index !== -1) {
      scheduled.splice(index, 1)
    }
  })

  const schedule = vi.fn(async (input: Parameters<SchedulerPort['schedule']>[0]) => {
    const identifier = `scheduled-${++nextId}`
    scheduled.push({ key: input.key, identifier })

    return identifier
  })

  const scheduler: SchedulerPort = {
    list: async () => scheduled.map(({ key, identifier }) => ({ identifier, key })),
    cancel,
    schedule,
  }

  return { scheduler, cancel, schedule }
}

const session: DesiredNotification = {
  key: 'session:w1',
  kind: 'session',
  fireAt: new Date('2026-09-17T07:00:00.000Z'),
  workout: {
    id: 'w1',
    date: '2026-09-17T07:00:00.000Z',
    type: 'endurance',
    title: 'Endurance fondamentale',
    durationMinutes: 90,
    intensityTarget: 'Facile',
    structure: 'Continu',
    status: 'planned',
    reason: 'Base',
  },
}

describe('channels', () => {
  it('has one per kind, so an OS-level mute maps to one of our switches', () => {
    expect(new Set(Object.values(CHANNEL_FOR_KIND))).toEqual(
      new Set(['sessions', 'weekly', 'nudges']),
    )
  })

  /**
   * The three ids, read off the calls rather than the source.
   *
   * A channel created under an id `CHANNEL_FOR_KIND` does not point at is one no
   * notification ever lands in, and Android's fallback is silence — no error, no
   * crash, just a rider who never hears about tomorrow's session.
   */
  async function createdChannels() {
    platform.OS = 'android'

    await ensureChannels(translation)

    const calls = vi.mocked(Notifications.setNotificationChannelAsync).mock.calls

    return { calls, byId: new Map(calls.map(([id, options]) => [id, options])) }
  }

  it('creates one on Android, id per kind, derived from the map the scheduler reads', async () => {
    const { calls, byId } = await createdChannels()

    expect(calls).toHaveLength(3)
    expect(new Set(byId.keys())).toEqual(new Set(Object.values(CHANNEL_FOR_KIND)))
  })

  it('gives each channel the interruption level its kind is meant to carry', async () => {
    const { byId } = await createdChannels()

    // AndroidImportance: HIGH = 6, DEFAULT = 5, LOW = 4.
    expect(byId.get(CHANNEL_FOR_KIND.session)?.importance).toBe(6)
    expect(byId.get(CHANNEL_FOR_KIND.weekly)?.importance).toBe(5)
    expect(byId.get(CHANNEL_FOR_KIND.inactivity)?.importance).toBe(4)
  })

  it('names each channel from the catalogue, in the language it is handed', async () => {
    const { calls } = await createdChannels()

    expect(calls.map(([, options]) => options.name)).toEqual([
      translate('fr', 'notifications.settings.channelSessions'),
      translate('fr', 'notifications.settings.channelWeekly'),
      translate('fr', 'notifications.settings.channelNudges'),
    ])
  })

  it('creates nothing on iOS, where a channel is a concept that does not exist', async () => {
    platform.OS = 'ios'

    await ensureChannels(translation)

    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled()
  })
})

describe('the notification handler', () => {
  // Read while the modules are still being evaluated, not inside a test: vitest
  // wipes a mock's call history before every test, so a registration that
  // happens at import time is long gone by the time a test body runs. That the
  // read happens here at all is the assertion — `setNotificationHandler` must
  // run at module scope, because a notification arriving before React mounts is
  // handed to whatever handler exists then, and with none it is dropped without
  // a word.
  const registered = vi.mocked(Notifications.setNotificationHandler).mock.calls[0]?.[0]

  it('is registered by the time the module finishes loading', () => {
    expect(registered?.handleNotification).toBeTypeOf('function')
  })

  it('shows the banner and the list entry, and asks for no badge', async () => {
    const behavior = await registered?.handleNotification({} as Notifications.Notification)

    expect(behavior).toEqual({
      shouldPlaySound: true,
      shouldSetBadge: false,
      // No badge: there is no history, so a count would announce unread things
      // that do not exist.
      shouldShowBanner: true,
      shouldShowList: true,
    })
    // `shouldShowAlert` was removed in SDK 57 — a handler still returning it, and
    // only it, shows nothing at all. Nothing else in this repo can notice that
    // without a device in hand.
    expect(behavior).not.toHaveProperty('shouldShowAlert')
  })
})

describe('reconcile', () => {
  it('schedules what is missing', async () => {
    const { scheduler, schedule } = port()

    await reconcile([session], translation, 'fr', scheduler)

    expect(schedule).toHaveBeenCalledTimes(1)
    // The key we hand over is the whole mechanism: it is the only thing
    // `list()` can read back. A bare `session:w1` here would leave `present`
    // empty forever and re-schedule — and cancel — everything, every pass.
    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'gradnt:session:w1',
        channelId: 'sessions',
        fireAt: session.fireAt,
      }),
    )
  })

  it('cancels what is no longer wanted', async () => {
    const { scheduler, cancel } = port([{ key: 'gradnt:session:gone', identifier: 'old-id' }])

    await reconcile([session], translation, 'fr', scheduler)

    expect(cancel).toHaveBeenCalledWith('old-id')
  })

  it('leaves alone what is already scheduled and still wanted', async () => {
    const { scheduler, schedule, cancel } = port([{ key: 'gradnt:session:w1', identifier: 'kept' }])

    await reconcile([session], translation, 'fr', scheduler)

    expect(schedule).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('is idempotent: the second pass writes nothing the first one already wrote', async () => {
    const { scheduler, schedule, cancel } = port()

    await reconcile([session], translation, 'fr', scheduler)
    await reconcile([session], translation, 'fr', scheduler)

    // One across both passes, not zero: the first pass had to write, and the
    // second had to notice. An empty pending list starting out is what makes
    // this the property rather than a restatement of "leaves alone".
    expect(schedule).toHaveBeenCalledTimes(1)
    expect(cancel).not.toHaveBeenCalled()
  })

  it('never touches a notification that is not ours', async () => {
    const { scheduler, cancel } = port([
      { key: 'gradnt:session:gone', identifier: 'ours-but-unwanted' },
      { key: 'someone-elses', identifier: 'foreign' },
    ])

    await reconcile([], translation, 'fr', scheduler)

    // Mixed, so the guard is proven while there is also something legitimate to
    // cancel: a blanket "cancel nothing" fails this, and so does "cancel all".
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(cancel).toHaveBeenCalledWith('ours-but-unwanted')
    expect(cancel).not.toHaveBeenCalledWith('foreign')
  })
})
