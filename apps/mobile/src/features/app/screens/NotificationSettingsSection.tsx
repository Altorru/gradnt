import * as ExpoLinking from 'expo-linking'
import { Linking, Platform } from 'react-native'
import { XStack, YStack } from 'tamagui'

import { GradntButton, GradntText } from '@/design-system'
import { NotificationPreferenceCard } from '@/features/app/components/NotificationPreferenceCard'
import { shouldRequestPermission } from '@/features/app/domain/notification-settings'
import { useNotificationPermission } from '@/features/app/hooks/use-notification-permission'
import { usePreferencesStore } from '@/features/app/store/preferences.store'
import { useTranslation } from '@/i18n'

export function NotificationSettingsSection() {
  const { t } = useTranslation()
  const { permission, request } = useNotificationPermission()
  const preferences = usePreferencesStore()

  /**
   * Asked for the moment a switch goes on, never on launch: a prompt the rider
   * did not reach for is refused, and a refusal is usually permanent. Once the
   * OS has stopped offering it, asking again is a no-op that reads as a bug —
   * hence `shouldRequestPermission` rather than a plain call.
   */
  const enable = (wasOn: boolean, isOn: boolean, apply: () => void) => {
    if (!shouldRequestPermission(wasOn, isOn, permission)) {
      apply()
      return
    }

    void request().then((granted) => {
      if (granted) {
        apply()
      }
    })
  }

  return (
    <YStack gap="$4">
      <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
        {t('notifications.section')}
      </GradntText>

      <NotificationPreferenceCard beforeChange={enable} />

      {/*
        Android refuses exact alarms by default, and an inexact one can arrive up
        to an hour late: a 14:30 reminder measured at 14:36, and the same alarm
        reads `window=+6m32s` before the rider grants this and `window=0` after.

        Shown on every Android device with a reminder on, because nothing in JS
        can read the app-op, and the system screen simply says it is already
        allowed. The action takes no data URI — `sendIntent` has none — so it
        lands on the list rather than this app's own toggle.
      */}
      {Platform.OS === 'android' && preferences.sessionReminder ? (
        <XStack gap="$2" alignItems="center">
          <GradntText muted fontSize={13} flex={1}>
            {t('notifications.settings.exactAlarmsNote')}
          </GradntText>

          <GradntButton
            tone="secondary"
            minHeight={40}
            onPress={() =>
              void ExpoLinking.sendIntent('android.settings.REQUEST_SCHEDULE_EXACT_ALARM')
            }
          >
            {t('notifications.settings.exactAlarmsAction')}
          </GradntButton>
        </XStack>
      ) : null}

      {permission === 'denied' ? (
        <XStack gap="$2" alignItems="center">
          <GradntText muted fontSize={13} flex={1}>
            {t('notifications.settings.permissionDenied')}
          </GradntText>

          <GradntButton tone="secondary" minHeight={40} onPress={() => void Linking.openSettings()}>
            {t('notifications.settings.openSystemSettings')}
          </GradntButton>
        </XStack>
      ) : null}
    </YStack>
  )
}
