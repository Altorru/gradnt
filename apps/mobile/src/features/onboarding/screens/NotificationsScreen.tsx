import { OnboardingSaveFeedback } from '../components/OnboardingSaveFeedback'
import { ArrowLeft, ArrowRight } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { Linking, Platform } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntHeading,
  GradntIconButton,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { colors } from '@/design-system/tokens'
import { NotificationPreferenceCard } from '@/features/app/components/NotificationPreferenceCard'
import { useNotificationPermission } from '@/features/app/hooks/use-notification-permission'
import { useTranslation } from '@/i18n'
import { openExactAlarmSettings } from '@/services/notifications/exact-alarm-settings'

import { OnboardingProgress } from '../components/OnboardingProgress'
import { useOnboardingStore } from '../store/onboarding.store'

/**
 * The step before the review, where the rider says what GRADNT may tell them.
 *
 * Consent is asked for on Continue, not on arrival: the switches are the
 * explanation, and a prompt that covers them before they have been read asks
 * the rider to answer a question they have not seen yet.
 *
 * The switches start on, so this step is also the only moment a fresh install
 * ever asks at all — Settings only asks when a switch goes from off to on.
 */
export function NotificationsScreen() {
  const saving = useOnboardingStore((state) => state.saving)
  const router = useRouter()
  const { t } = useTranslation()
  const { permission, request } = useNotificationPermission()
  const markSeen = useOnboardingStore((state) => state.setNotificationsSeen)

  const leave = async () => {
    if (!(await markSeen())) return
    router.push('/onboarding/review')
  }

  const submit = async () => {
    // A refusal the rider has already made is not shown again by the OS, so
    // asking is only worth the round trip while the answer is still open.
    if (permission === 'undetermined') {
      await request()
    }

    // Android needs a second grant for the reminder to be exact — its alarm
    // permission is refused by default, and an inexact one can arrive an hour
    // late. The two asks belong together, on the step where the rider has just
    // chosen a time, rather than one here and one in Settings.
    await openExactAlarmSettings()

    await leave()
  }

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$7">
          <OnboardingSaveFeedback />
          <XStack alignItems="center" justifyContent="space-between">
            <GradntIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
              <ArrowLeft size={18} color={'$textPrimary'} />
            </GradntIconButton>

            <GradntText muted fontSize={12} weight="medium">
              6 / 7
            </GradntText>
          </XStack>

          <OnboardingProgress step={6} total={7} />

          <YStack gap="$2">
            <GradntHeading>{t('onboarding.notifications.title')}</GradntHeading>

            <GradntText muted>{t('onboarding.notifications.subtitle')}</GradntText>
          </YStack>

          <NotificationPreferenceCard />

          {/* Android only, and before the action rather than beside it: the
              screen opens by itself on Continue, so this is where the rider
              learns what it is for. */}
          {Platform.OS === 'android' ? (
            <GradntText muted fontSize={13} lineHeight={19}>
              {t('notifications.settings.exactAlarmsNote')}
            </GradntText>
          ) : null}

          {permission === 'denied' ? (
            <XStack gap="$2" alignItems="center">
              <GradntText muted fontSize={13} flex={1}>
                {t('notifications.settings.permissionDenied')}
              </GradntText>

              <GradntButton
                tone="secondary"
                minHeight={40}
                onPress={() => void Linking.openSettings()}
              >
                {t('notifications.settings.openSystemSettings')}
              </GradntButton>
            </XStack>
          ) : null}

          <YStack gap="$3">
            <GradntButton
              iconAfter={<ArrowRight size={18} color={colors.graphite950} />}
              disabled={saving}
              onPress={() => void submit()}
            >
              {t('common.continue')}
            </GradntButton>

            {/* Deliberately available: a rider who does not want to decide now
                should not be held at a prompt, and every default here is
                reachable again from Settings. */}
            <GradntButton
              tone="ghost"
              minHeight={44}
              disabled={saving}
              onPress={() => void leave()}
            >
              {t('onboarding.notifications.later')}
            </GradntButton>
          </YStack>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
