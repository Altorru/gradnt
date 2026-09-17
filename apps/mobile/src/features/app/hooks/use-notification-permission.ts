import * as Notifications from 'expo-notifications'
import { useEffect, useState } from 'react'

import { useTranslation } from '@/i18n'
import { ensureChannels } from '@/services/notifications/notification.scheduler'

import { permissionStateOf, type PermissionState } from '../domain/notification-settings'

/**
 * The notification permission, and the one way to ask for it.
 *
 * Shared by the Settings section and the onboarding step, which want the same
 * answer at different moments — a switch going on, or a Continue being tapped.
 * The reading lives here rather than in either screen because the iOS rule for
 * what counts as authorised is not something to spell twice.
 */
export function useNotificationPermission(): {
  permission: PermissionState
  request: () => Promise<boolean>
} {
  const translation = useTranslation()
  const [permission, setPermission] = useState<PermissionState>('undetermined')

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((status) => {
      setPermission(
        permissionStateOf(
          status.granted,
          status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL,
          status.canAskAgain,
        ),
      )
    })
  }, [])

  /**
   * The Android channels come first, because Android 13 shows no prompt at all
   * until one exists — asking before it would look like a no-op.
   */
  const request = async () => {
    await ensureChannels(translation)

    const status = await Notifications.requestPermissionsAsync()
    const granted =
      status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL

    setPermission(permissionStateOf(granted, false, status.canAskAgain))

    return granted
  }

  return { permission, request }
}
