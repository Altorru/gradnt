/**
 * The decisions the notification settings make, away from the components.
 *
 * Here rather than in the section because the section imports the design
 * system, `expo-notifications` and the preferences store — a test that reached
 * them would be testing the app's whole boot to check two lines of arithmetic.
 */

export type PermissionState = 'undetermined' | 'granted' | 'denied'

/**
 * The OS's answer, as the three states the screens distinguish.
 *
 * Flags rather than expo's status object, so the iOS subtlety is testable
 * without the native module: `PROVISIONAL` — quiet delivery, no prompt — is
 * authorised even though the root status does not say `granted`.
 */
export function permissionStateOf(
  granted: boolean,
  provisional: boolean,
  canAskAgain: boolean,
): PermissionState {
  if (granted || provisional) {
    return 'granted'
  }

  return canAskAgain ? 'undetermined' : 'denied'
}

/**
 * Whether reaching for a feature is the moment to ask for consent.
 *
 * Only when the switch is going on, and only while the OS is still undecided:
 * a prompt the rider already refused is not shown again by the OS, so asking
 * again is a no-op that reads as a bug.
 */
export function shouldRequestPermission(
  wasOn: boolean,
  isOn: boolean,
  permission: PermissionState,
): boolean {
  return !wasOn && isOn && permission === 'undetermined'
}

/**
 * The next time, a quarter of an hour away, bounded to the day.
 *
 * Bounded rather than rolling over: a reminder at 23:00 stepped past midnight
 * would become 00:00 and silently move the rider's alarm to the small hours.
 */
export function stepReminderTime(
  hour: number,
  minute: number,
  deltaMinutes: number,
): { hour: number; minute: number } {
  const total = Math.min(23 * 60 + 45, Math.max(0, hour * 60 + minute + deltaMinutes))

  return { hour: Math.floor(total / 60), minute: total % 60 }
}
