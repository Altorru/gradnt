import { Linking } from 'react-native'
import { XStack, YStack } from 'tamagui'

import { GradntButton, GradntText } from '@/design-system'
import { NotificationPreferenceCard } from '@/features/app/components/NotificationPreferenceCard'
import { shouldRequestPermission } from '@/features/app/domain/notification-settings'
import { useNotificationPermission } from '@/features/app/hooks/use-notification-permission'
import { useTranslation } from '@/i18n'

export function NotificationSettingsSection() {
  const { t } = useTranslation()
  const { permission, request } = useNotificationPermission()

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
