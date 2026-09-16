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

function port(scheduled: { key: string; identifier: string }[] = []) {
  const cancel = vi.fn(async () => {})
  const schedule = vi.fn(async () => 'new-id')

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

  it('is idempotent: a second pass changes nothing', async () => {
    const { scheduler, schedule, cancel } = port([{ key: 'gradnt:session:w1', identifier: 'kept' }])

    await reconcile([session], translation, 'fr', scheduler)
    await reconcile([session], translation, 'fr', scheduler)

    expect(schedule).not.toHaveBeenCalled()
    expect(cancel).not.toHaveBeenCalled()
  })

  it('never touches a notification that is not ours', async () => {
    const { scheduler, cancel } = port([{ key: 'someone-elses', identifier: 'foreign' }])

    await reconcile([], translation, 'fr', scheduler)

    expect(cancel).not.toHaveBeenCalled()
  })
})
