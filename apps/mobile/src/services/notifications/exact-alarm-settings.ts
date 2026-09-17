import Constants from 'expo-constants'
import * as IntentLauncher from 'expo-intent-launcher'
import { Platform } from 'react-native'

/**
 * Android's "Alarms & reminders" screen, opened on this app.
 *
 * Without the grant, `SCHEDULE_EXACT_ALARM` stays refused by default and expo
 * falls back to an inexact alarm whose window runs to an hour: a reminder the
 * rider set for 15:00 can arrive at 15:58. Only the rider can grant it, so this
 * is the ask.
 *
 * The `package:` data URI is what lands on our own toggle rather than the list of
 * every app that requests the permission. `Linking.sendIntent` takes no data, so
 * this uses `expo-intent-launcher`, which does. The module is Android-only and
 * carries no iOS code, so nothing else has to change for it.
 *
 * Nothing reads the app-op back: whether it is already granted cannot be seen
 * from JS, which is why callers offer this rather than checking first.
 */
export async function openExactAlarmSettings(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  const packageName = Constants.expoConfig?.android?.package

  await IntentLauncher.startActivityAsync('android.settings.REQUEST_SCHEDULE_EXACT_ALARM', {
    data: packageName === undefined ? undefined : `package:${packageName}`,
  })
}
