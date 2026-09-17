import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'

/**
 * Routes a tap on a notification to the screen it names.
 *
 * Two paths, because there are two: with the app already running the listener
 * fires, and from a cold start it never does — the response is sitting in
 * `getLastNotificationResponse()` by the time React mounts, and is read and
 * then cleared so a later launch does not replay the same route.
 */
export function NotificationObserver() {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url

      if (typeof url === 'string') {
        router.push(url as never)
      }
    }

    const last = Notifications.getLastNotificationResponse()

    if (last?.notification) {
      redirect(last.notification)
      Notifications.clearLastNotificationResponse()
    }

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      redirect(response.notification)
    })

    return () => subscription.remove()
  }, [])

  return null
}
