import { ArrowLeft, ArrowRight, CheckCircle2, Link2, ShieldCheck } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntIconButton,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { colors } from '@/design-system/tokens'

import { useTranslation } from '@/i18n'

import { OnboardingProgress } from '../components/OnboardingProgress'
import {
  defaultStravaConnection,
  deferredStravaConnection,
  STRAVA_ERROR_KEYS,
} from '../domain/strava.schema'
import { useOnboardingStore } from '../store/onboarding.store'
import { stravaService, type StravaServiceError } from '../services/strava.service'

export function StravaScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const setStrava = useOnboardingStore((state) => state.setStrava)
  const storedStrava = useOnboardingStore((state) => state.strava)
  const hydrated = useOnboardingStore((state) => state.hydrated)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<StravaServiceError | null>(null)

  // The persisted store is the single source of truth, so a connection survives
  // an app restart instead of being reset by an in-memory service default.
  const connection = storedStrava ?? defaultStravaConnection
  const isLoading = !hydrated || isConnecting

  const connect = async () => {
    setError(null)
    setIsConnecting(true)

    const result = await stravaService.connect()

    if (result.ok) {
      setStrava(result.connection)
    } else {
      setError(result.error)
    }

    setIsConnecting(false)
  }

  const connected = connection.status === 'connected'
  const deferConnection = () => {
    setStrava(deferredStravaConnection)
    router.push('/onboarding/notifications')
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
              5 / 7
            </GradntText>
          </XStack>

          <OnboardingProgress step={5} total={7} />

          <YStack gap="$2">
            <GradntHeading>{t('onboarding.strava.title')}</GradntHeading>

            <GradntText muted>{t('onboarding.strava.subtitle')}</GradntText>
          </YStack>

          <GradntCard accent gap="$4">
            <XStack alignItems="center" gap="$3">
              <YStack
                width={44}
                height={44}
                borderRadius={14}
                alignItems="center"
                justifyContent="center"
                backgroundColor="$backgroundSubtle"
              >
                {connected ? (
                  <CheckCircle2 size={21} color={'$positive'} />
                ) : (
                  <Link2 size={21} color={'$warning'} />
                )}
              </YStack>

              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">
                  {connected
                    ? t('onboarding.strava.connected')
                    : t('onboarding.strava.notConnected')}
                </GradntText>
                <GradntText muted fontSize={13}>
                  {connection.athleteName ?? t('onboarding.strava.noAccount')}
                </GradntText>
              </YStack>

              {connected ? (
                <GradntBadge tone="positive">{t('onboarding.strava.badgeConnected')}</GradntBadge>
              ) : null}
            </XStack>
          </GradntCard>

          <YStack gap="$4">
            <XStack gap="$3" alignItems="flex-start">
              <ShieldCheck size={19} color={'$recovery'} />
              <GradntText muted flex={1} fontSize={13} lineHeight={19}>
                {t('onboarding.strava.reassurance')}
              </GradntText>
            </XStack>

            <GradntText muted fontSize={12} lineHeight={18}>
              {t('onboarding.strava.recommendation')}
            </GradntText>
          </YStack>

          {error ? (
            <YStack gap="$2" padding="$4" borderRadius={16} backgroundColor="$backgroundSubtle">
              <GradntText color="$danger" weight="semibold" fontSize={13}>
                {t('onboarding.strava.errorTitle')}
              </GradntText>
              <GradntText muted fontSize={12} lineHeight={18}>
                {t(STRAVA_ERROR_KEYS[error.code], error.params)}
              </GradntText>
            </YStack>
          ) : null}

          <YStack gap="$3">
            <GradntButton
              disabled={isLoading || connected}
              opacity={isLoading || connected ? 0.55 : 1}
              iconAfter={
                isLoading ? (
                  <ActivityIndicator color={colors.graphite950} />
                ) : (
                  <Link2 size={18} color={colors.graphite950} />
                )
              }
              onPress={() => {
                void connect()
              }}
            >
              {isLoading
                ? t('onboarding.strava.connecting')
                : connected
                  ? t('onboarding.strava.accountConnected')
                  : t('onboarding.strava.connect')}
            </GradntButton>

            {connected ? (
              <GradntButton
                tone="secondary"
                iconAfter={<ArrowRight size={18} color={'$textPrimary'} />}
                onPress={() => {
                  router.push('/onboarding/notifications')
                }}
              >
                {t('common.continue')}
              </GradntButton>
            ) : (
              <GradntButton tone="ghost" onPress={deferConnection}>
                {t('onboarding.strava.defer')}
              </GradntButton>
            )}
          </YStack>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
