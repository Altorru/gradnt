import { ArrowLeft, ArrowRight } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { Linking } from 'react-native'
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
  const router = useRouter()
  const { t } = useTranslation()
  const { permission, request } = useNotificationPermission()
  const markSeen = useOnboardingStore((state) => state.setNotificationsSeen)

  const leave = () => {
    markSeen()
    router.push('/onboarding/review')
  }

  const submit = async () => {
    // A refusal the rider has already made is not shown again by the OS, so
    // asking is only worth the round trip while the answer is still open.
    if (permission === 'undetermined') {
      await request()
    }

    leave()
  }

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$7">
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
              onPress={() => void submit()}
            >
              {t('common.continue')}
            </GradntButton>

            {/* Deliberately available: a rider who does not want to decide now
                should not be held at a prompt, and every default here is
                reachable again from Settings. */}
            <GradntButton tone="ghost" minHeight={44} onPress={leave}>
              {t('onboarding.notifications.later')}
            </GradntButton>
          </YStack>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
