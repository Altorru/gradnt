import { describe, expect, it } from 'vitest'

import {
  permissionStateOf,
  shouldRequestPermission,
  stepReminderTime,
} from './notification-settings'

describe('permissionStateOf', () => {
  it('reads a plain grant, and a grant the rider can still be asked for', () => {
    expect(permissionStateOf(true, false, false)).toBe('granted')
    expect(permissionStateOf(false, false, true)).toBe('undetermined')
  })

  it('counts iOS provisional as authorised, which the root status does not say', () => {
    expect(permissionStateOf(false, true, false)).toBe('granted')
  })

  it('is denied once the OS stops offering the prompt', () => {
    expect(permissionStateOf(false, false, false)).toBe('denied')
  })
})

describe('shouldRequestPermission', () => {
  it('asks when a switch is turned on and consent is undecided', () => {
    expect(shouldRequestPermission(false, true, 'undetermined')).toBe(true)
  })

  it('does not ask when switching something off', () => {
    expect(shouldRequestPermission(true, false, 'undetermined')).toBe(false)
  })

  it('does not ask again once granted', () => {
    expect(shouldRequestPermission(false, true, 'granted')).toBe(false)
  })

  it('does not re-prompt after a refusal, which the OS would ignore anyway', () => {
    expect(shouldRequestPermission(false, true, 'denied')).toBe(false)
  })
})

describe('stepReminderTime', () => {
  it('moves by a quarter of an hour', () => {
    expect(stepReminderTime(7, 0, 15)).toEqual({ hour: 7, minute: 15 })
    expect(stepReminderTime(7, 0, -15)).toEqual({ hour: 6, minute: 45 })
  })

  it('carries across the hour, both ways', () => {
    expect(stepReminderTime(7, 45, 15)).toEqual({ hour: 8, minute: 0 })
    expect(stepReminderTime(8, 0, -15)).toEqual({ hour: 7, minute: 45 })
  })

  it('stops at the ends of the day rather than rolling into the next one', () => {
    expect(stepReminderTime(0, 0, -15)).toEqual({ hour: 0, minute: 0 })
    expect(stepReminderTime(23, 45, 15)).toEqual({ hour: 23, minute: 45 })
  })
})
