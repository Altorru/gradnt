import { describe, expect, it, vi } from 'vitest'

import type { Translation } from '@/i18n'
// The leaf module, not `@/i18n`: the barrel pulls in the preferences store and
// with it expo-secure-store, which this test has no business loading.
import { translate, translatePlural } from '@/i18n/translate'
import type { DesiredNotification } from '@/lib/domain/notification-plan'

import { reconcile, type SchedulerPort } from './notification.scheduler'

// Hoisted above the imports by vitest. `expoScheduler` lives in the module
// under test and imports `expo-notifications` at module scope, so without this
// stubbing, importing `reconcile` alone would drag the native module into the
// run. Same class of problem as the `react-native` mock next door.
vi.mock('expo-notifications', () => ({
  getAllScheduledNotificationsAsync: vi.fn(),
  cancelScheduledNotificationAsync: vi.fn(),
  scheduleNotificationAsync: vi.fn(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}))

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
