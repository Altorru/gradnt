import { ArrowLeft, ArrowRight, CheckCircle2, Link2, ShieldCheck } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntBadge,
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntIconButton,
  GradntMobileShell,
  GradntText,
} from '@/design-system'
import { colors } from '@/design-system/tokens'

import { OnboardingProgress } from '../components/OnboardingProgress'
import { defaultStravaConnection, type StravaConnection } from '../domain/strava.schema'
import { useOnboardingStore } from '../store/onboarding.store'
import { stravaService, type StravaServiceError } from '../services/strava.service'

export function StravaScreen() {
  const router = useRouter()
  const setStrava = useOnboardingStore((state) => state.setStrava)
  const [connection, setConnection] = useState<StravaConnection>(defaultStravaConnection)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<StravaServiceError | null>(null)

  useEffect(() => {
    let mounted = true

    void stravaService.getConnection().then((currentConnection) => {
      if (mounted) {
        setConnection(currentConnection)
        setStrava(currentConnection)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
    }
  }, [setStrava])

  const connect = async () => {
    setError(null)
    setIsLoading(true)

    const result = await stravaService.connect()

    if (result.ok) {
      setConnection(result.connection)
      setStrava(result.connection)
    } else {
      setError(result.error)
    }

    setIsLoading(false)
  }

  const connected = connection.status === 'connected'

  return (
    <GradntMobileShell>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingTop: 22,
          paddingBottom: 28,
        }}
      >
        <YStack gap="$7">
          <XStack alignItems="center" justifyContent="space-between">
            <GradntIconButton onPress={() => router.back()}>
              <ArrowLeft size={18} color={colors.bone100} />
            </GradntIconButton>

            <GradntText muted fontSize={12} weight="medium">
              5 / 6
            </GradntText>
          </XStack>

          <OnboardingProgress step={5} total={6} />

          <YStack gap="$2">
            <GradntHeading>Relie tes sorties</GradntHeading>

            <GradntText muted>
              Avec ton historique Strava, GRADNT pourra mieux comprendre ton point de départ et
              rendre la suite plus pertinente.
            </GradntText>
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
                  <CheckCircle2 size={21} color={colors.success} />
                ) : (
                  <Link2 size={21} color={colors.orange} />
                )}
              </YStack>

              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">
                  {connected ? 'Strava est connecté' : 'Strava n’est pas connecté'}
                </GradntText>
                <GradntText muted fontSize={13}>
                  {connection.athleteName ?? 'Aucun compte lié pour le moment'}
                </GradntText>
              </YStack>

              {connected ? <GradntBadge tone="positive">Connecté</GradntBadge> : null}
            </XStack>
          </GradntCard>

          <YStack gap="$4">
            <XStack gap="$3" alignItems="flex-start">
              <ShieldCheck size={19} color={colors.alpine} />
              <GradntText muted flex={1} fontSize={13} lineHeight={19}>
                Tu contrôles la connexion. GRADNT utilisera uniquement les activités nécessaires
                pour personnaliser ton expérience.
              </GradntText>
            </XStack>

            <GradntText muted fontSize={12} lineHeight={18}>
              La connexion réelle sera disponible lorsque l’application Strava de GRADNT et son
              adresse de retour seront configurées.
            </GradntText>
          </YStack>

          {error ? (
            <YStack gap="$2" padding="$4" borderRadius={16} backgroundColor="$backgroundSubtle">
              <GradntText color="$danger" weight="semibold" fontSize={13}>
                Connexion indisponible
              </GradntText>
              <GradntText muted fontSize={12} lineHeight={18}>
                {error.message}
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
              {isLoading ? 'Vérification…' : connected ? 'Compte connecté' : 'Connecter Strava'}
            </GradntButton>

            {connected ? (
              <GradntButton
                tone="secondary"
                iconAfter={<ArrowRight size={18} color={colors.bone100} />}
                onPress={() => {
                  router.push('./review')
                }}
              >
                Continuer
              </GradntButton>
            ) : null}
          </YStack>
        </YStack>
      </ScrollView>
    </GradntMobileShell>
  )
}
