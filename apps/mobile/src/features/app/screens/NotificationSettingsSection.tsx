import * as Notifications from 'expo-notifications'
import { Minus, Plus } from '@tamagui/lucide-icons-2'
import { useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntCard,
  GradntIconButton,
  GradntSwitch,
  GradntText,
} from '@/design-system'
import { usePreferencesStore } from '@/features/app/store/preferences.store'
import {
  shouldRequestPermission,
  stepReminderTime,
  type PermissionState,
} from '@/features/app/domain/notification-settings'
import { useTranslation } from '@/i18n'
import { ensureChannels } from '@/services/notifications/notification.scheduler'

/** A time the rider steps by a quarter of an hour, either side of the readout. */
function GradntHourStepper({
  label,
  hour,
  minute,
  onChange,
}: {
  label: string
  hour: number
  minute: number
  onChange: (hour: number, minute: number) => void
}) {
  const { t } = useTranslation()
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`

  const shift = (deltaMinutes: number) => {
    const next = stepReminderTime(hour, minute, deltaMinutes)
    onChange(next.hour, next.minute)
  }

  return (
    <XStack justifyContent="space-between" alignItems="center" gap="$3">
      <GradntText fontSize={15}>{label}</GradntText>

      <XStack alignItems="center" gap="$2">
        <GradntIconButton
          accessibilityLabel={t('notifications.settings.earlier')}
          onPress={() => shift(-15)}
        >
          <Minus size={16} color="$textPrimary" />
        </GradntIconButton>

        {/*
          The time is one control, not three: a reader adjusting it should hear
          "07:00, adjustable" and swipe, rather than hunt for a pair of buttons.
        */}
        <GradntText
          accessibilityRole="adjustable"
          accessibilityValue={{ text: time }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'increment') {
              shift(15)
            } else if (event.nativeEvent.actionName === 'decrement') {
              shift(-15)
            }
          }}
          style={{ minWidth: 66, textAlign: 'center' }}
        >
          {time}
        </GradntText>

        <GradntIconButton
          accessibilityLabel={t('notifications.settings.later')}
          onPress={() => shift(15)}
        >
          <Plus size={16} color="$textPrimary" />
        </GradntIconButton>
      </XStack>
    </XStack>
  )
}

export function NotificationSettingsSection() {
  const translation = useTranslation()
  const { t } = translation
  const preferences = usePreferencesStore()
  const [permission, setPermission] = useState<PermissionState>('undetermined')

  useEffect(() => {
    void Notifications.getPermissionsAsync().then((status) => {
      /**
       * `ios.status` and not the root `status`: iOS is finer-grained than
       * Android, and `PROVISIONAL` — quiet delivery, no prompt — counts as
       * authorised even though the root status does not say `granted`.
       */
      const granted =
        status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL

      setPermission(granted ? 'granted' : status.canAskAgain ? 'undetermined' : 'denied')
    })
  }, [])

  /**
   * Asked when a switch goes on, never on launch.
   *
   * A prompt at first launch is refused, and a refusal is usually permanent.
   * Asked at the moment the rider reaches for the feature, the prompt answers
   * something they just did.
   *
   * The Android channels come first because Android 13 will not show the prompt
   * at all until one exists.
   */
  const enable = async (wasOn: boolean, isOn: boolean, apply: () => void) => {
    if (!shouldRequestPermission(wasOn, isOn, permission)) {
      apply()
      return
    }

    await ensureChannels(translation)
    const status = await Notifications.requestPermissionsAsync()
    const granted =
      status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL

    setPermission(granted ? 'granted' : 'denied')

    if (granted) {
      apply()
    }
  }

  return (
    <YStack gap="$4">
      <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
        {t('notifications.section')}
      </GradntText>

      <GradntCard gap="$4" padding="$4">
        <GradntSwitch
          label={t('notifications.settings.sessionReminder')}
          value={preferences.sessionReminder}
          onValueChange={(value) =>
            void enable(preferences.sessionReminder, value, () =>
              preferences.setSessionReminder(value),
            )
          }
        />

        {preferences.sessionReminder ? (
          <GradntHourStepper
            label={t('notifications.settings.reminderHour')}
            hour={preferences.reminderHour}
            minute={preferences.reminderMinute}
            onChange={preferences.setReminderTime}
          />
        ) : null}

        <GradntSwitch
          label={t('notifications.settings.weeklySummary')}
          value={preferences.weeklySummary}
          onValueChange={(value) =>
            void enable(preferences.weeklySummary, value, () => preferences.setWeeklySummary(value))
          }
        />

        <GradntSwitch
          label={t('notifications.settings.inactivityNudge')}
          value={preferences.inactivityNudge}
          onValueChange={(value) =>
            void enable(preferences.inactivityNudge, value, () =>
              preferences.setInactivityNudge(value),
            )
          }
        />
      </GradntCard>

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
