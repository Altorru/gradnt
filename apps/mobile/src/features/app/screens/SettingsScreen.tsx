import {
  ArrowLeft,
  ChevronRight,
  Download,
  RefreshCw,
  ShieldCheck,
  Unlink,
} from '@tamagui/lucide-icons-2'
import { useQueryClient } from '@tanstack/react-query'
import { format as formatDate, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable } from 'react-native'
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntCard,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntStravaConnectBlock,
  GradntText,
} from '@/design-system'
import { stravaService } from '@/features/onboarding/services/strava.service'
import { goalTypeLabels } from '@/features/onboarding/domain/goal.options'
import { describeProfile } from '@/features/onboarding/domain/profile.options'
import { importFtpFromStrava, loadFtpHistory, recordDeclaredFtp } from '@/services/ftp/ftp.service'
import type { FtpEntry } from '@/services/ftp/ftp.persistence'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'
import { describeActivityFailure } from '@/services/gradnt.repository'
import type { Activity } from '@/lib/domain'

/**
 * Queries whose value comes from Strava.
 *
 * Named rather than matched by predicate: a predicate would quietly pick up
 * future queries that happen to share a word, and each one refetched here costs
 * a request from a quota shared by every user.
 */
const STRAVA_QUERY_KEYS = [['activities'], ['training-metrics'], ['goal-current-value']] as const

/**
 * One turn every 900ms, straight through — constant motion, so linear. A bezier
 * that eases would make the glyph visibly pulse once per revolution.
 *
 * Runs on the UI thread as a keyframe loop, so it keeps turning while the sync
 * occupies JS. Nothing else on the screen depends on the angle, so there is no
 * shared value to read and no React state to churn.
 */
const SPIN = {
  animationName: {
    from: { transform: [{ rotate: '0deg' }] },
    to: { transform: [{ rotate: '360deg' }] },
  },
  animationDuration: 900,
  animationIterationCount: 'infinite' as const,
  animationTimingFunction: cubicBezier(0, 0, 1, 1),
}

/**
 * The refresh glyph, turning while a sync runs.
 *
 * Reduced motion throws the rotation away and keeps the button's own
 * "Synchronisation…" label, which already says what is happening.
 */
function RefreshGlyph({ spinning }: { spinning: boolean }) {
  const reducedMotion = useReducedMotion()

  return (
    <Animated.View style={spinning && !reducedMotion ? SPIN : undefined}>
      <RefreshCw size={17} color="$textPrimary" />
    </Animated.View>
  )
}

/** A tappable settings entry: what it is, its current value, and where it goes. */
function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string
  value: string
  onPress: () => void
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8}>
      {({ pressed }) => (
        <XStack
          alignItems="center"
          justifyContent="space-between"
          gap="$3"
          opacity={pressed ? 0.6 : 1}
        >
          <YStack flex={1} gap="$1">
            <GradntText weight="semibold">{label}</GradntText>
            <GradntText muted fontSize={13}>
              {value}
            </GradntText>
          </YStack>

          <ChevronRight size={17} color="$textSecondary" />
        </XStack>
      )}
    </Pressable>
  )
}

export function SettingsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const connection = useOnboardingStore((state) => state.strava)
  const storedGoal = useOnboardingStore((state) => state.goal)
  const storedProfile = useOnboardingStore((state) => state.profile)
  const setStrava = useOnboardingStore((state) => state.setStrava)
  const connected = connection?.status === 'connected'

  const [isSyncing, setIsSyncing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncReport, setSyncReport] = useState<string | null>(null)

  /**
   * The FTP is held in a dated history, so the screen shows the latest entry
   * and when it was recorded — the evolution is the point of keeping one.
   */
  const [ftpHistory, setFtpHistory] = useState<FtpEntry[]>([])
  const [draftFtp, setDraftFtp] = useState('')
  const [isImportingFtp, setIsImportingFtp] = useState(false)
  const [ftpMessage, setFtpMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadFtpHistory().then(setFtpHistory)
  }, [])

  const latestFtp = ftpHistory.at(-1) ?? null

  const importFtp = async () => {
    setIsImportingFtp(true)
    setFtpMessage(null)

    const result = await importFtpFromStrava()

    if (result.status === 'imported') {
      setFtpHistory(await loadFtpHistory())
      setFtpMessage(`${result.value} W, déduits de tes zones de puissance Strava.`)
    } else if (result.status === 'noPowerZones') {
      // The common case, not a failure: most riders have never set an FTP in
      // Strava, and there is an obvious thing for them to do about it.
      setFtpMessage('Strava n’a pas de zones de puissance pour toi. Saisis ta FTP ci-dessous.')
    } else if (result.status === 'unrecognized') {
      // Not the rider's problem, and not something to describe as one.
      setFtpMessage(`Réponse inattendue de Strava (${result.summary}). Saisis ta FTP ci-dessous.`)
    } else {
      setFtpMessage('L’import a échoué. Réessaie dans un instant.')
    }

    setIsImportingFtp(false)
  }

  const saveFtp = async () => {
    const parsed = Math.round(Number(draftFtp))

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFtpMessage('Indique une valeur en watts.')
      return
    }

    await recordDeclaredFtp(parsed)
    setFtpHistory(await loadFtpHistory())
    setDraftFtp('')
    setFtpMessage(null)
  }

  const connect = async () => {
    setIsConnecting(true)
    setError(null)

    const result = await stravaService.connect()

    if (result.ok) {
      setStrava(result.connection)
      await Promise.all(
        STRAVA_QUERY_KEYS.map((queryKey) => queryClient.refetchQueries({ queryKey })),
      )
    } else {
      setError(result.error.message)
    }

    setIsConnecting(false)
  }

  const resync = async () => {
    setIsSyncing(true)
    setError(null)
    setSyncReport(null)

    // `refetchQueries` resolves whether or not the query succeeded, so the
    // outcome has to be read back off the query it produced. Without that, a
    // sync that fetched nothing ends in silence and looks like it worked.
    await Promise.all(STRAVA_QUERY_KEYS.map((queryKey) => queryClient.refetchQueries({ queryKey })))

    const activities = queryClient.getQueryState(['activities'])

    if (activities?.status === 'error') {
      setError(describeActivityFailure(activities.error))
    } else {
      const count = queryClient.getQueryData<Activity[]>(['activities'])?.length ?? 0
      setSyncReport(`${count} sortie${count > 1 ? 's' : ''} importée${count > 1 ? 's' : ''}`)
    }

    setIsSyncing(false)
  }

  const disconnect = async () => {
    if (!confirmingDisconnect) {
      // Two-step rather than a native alert, which behaves differently on web.
      setConfirmingDisconnect(true)
      return
    }

    setIsDisconnecting(true)
    setError(null)

    await stravaService.disconnect()
    queryClient.removeQueries({ queryKey: ['activities'] })
    queryClient.removeQueries({ queryKey: ['training-metrics'] })
    queryClient.removeQueries({ queryKey: ['goal-current-value'] })

    setConfirmingDisconnect(false)
    setIsDisconnecting(false)
  }

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$6">
          <XStack alignItems="center" gap="$3">
            <GradntIconButton accessibilityLabel="Revenir en arrière" onPress={() => router.back()}>
              <ArrowLeft size={18} color="$textPrimary" />
            </GradntIconButton>
            <GradntHeading>Réglages</GradntHeading>
          </XStack>

          {error ? (
            <GradntText color="$danger" fontSize={13}>
              {error}
            </GradntText>
          ) : null}

          {syncReport ? (
            <GradntText muted fontSize={13}>
              {syncReport}
            </GradntText>
          ) : null}

          <YStack gap="$4">
            <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
              STRAVA
            </GradntText>

            <GradntCard gap="$4" padding="$4">
              <YStack gap="$1">
                <GradntText weight="semibold">
                  {connected ? 'Compte connecté' : 'Aucun compte connecté'}
                </GradntText>
                <GradntText muted fontSize={13}>
                  {connection?.athleteName ?? 'Relie ton compte pour importer tes sorties.'}
                </GradntText>
              </YStack>

              {connected ? (
                <YStack gap="$3">
                  <GradntButton
                    tone="secondary"
                    disabled={isSyncing}
                    opacity={isSyncing ? 0.55 : 1}
                    iconAfter={<RefreshGlyph spinning={isSyncing} />}
                    onPress={() => void resync()}
                  >
                    {isSyncing ? 'Synchronisation…' : 'Resynchroniser mes sorties'}
                  </GradntButton>

                  <GradntButton
                    tone={confirmingDisconnect ? 'danger' : 'ghost'}
                    disabled={isDisconnecting}
                    iconAfter={<Unlink size={17} color="$textPrimary" />}
                    onPress={() => void disconnect()}
                  >
                    {confirmingDisconnect ? 'Confirmer la déconnexion' : 'Déconnecter Strava'}
                  </GradntButton>

                  {confirmingDisconnect ? (
                    <GradntText muted fontSize={12} lineHeight={18}>
                      Tes sorties importées seront effacées de cet appareil. Rien n’est supprimé
                      chez Strava.
                    </GradntText>
                  ) : null}
                </YStack>
              ) : (
                // Connects in place rather than pushing to the onboarding
                // screen: that one is step 5 of 6 and would walk a rider who
                // has already signed up back through the review flow.
                <GradntStravaConnectBlock
                  title="Connecter Strava"
                  description="GRADNT lit ton historique pour situer ton point de départ et adapter ce qu’il te propose."
                  onConnect={() => void connect()}
                  isConnecting={isConnecting}
                  errorMessage={error}
                />
              )}
            </GradntCard>
          </YStack>

          <YStack gap="$4">
            <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
              TON PROFIL
            </GradntText>

            <GradntCard gap="$4" padding="$4">
              <SettingsRow
                label="Profil cycliste"
                value={describeProfile(storedProfile)}
                onPress={() => router.push('/settings/profile')}
              />

              <SettingsRow
                label="Objectif"
                value={storedGoal ? goalTypeLabels[storedGoal.type] : 'À définir'}
                onPress={() => router.push('/settings/goal')}
              />
            </GradntCard>
          </YStack>

          <YStack gap="$4">
            <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
              PUISSANCE
            </GradntText>

            <GradntCard gap="$4" padding="$4">
              <YStack gap="$1">
                <GradntText weight="semibold">FTP</GradntText>
                <GradntText muted fontSize={13} lineHeight={18}>
                  {latestFtp === null
                    ? 'Aucune valeur enregistrée : ton objectif FTP ne peut pas être suivi.'
                    : `${latestFtp.value} W — ${
                        latestFtp.source === 'strava'
                          ? 'déduite de tes zones Strava'
                          : 'saisie par toi'
                      }, ${formatDistanceToNow(Date.parse(latestFtp.recordedAt), {
                        addSuffix: true,
                        locale: fr,
                      })}.`}
                </GradntText>
              </YStack>

              <GradntButton
                tone="secondary"
                disabled={isImportingFtp}
                opacity={isImportingFtp ? 0.55 : 1}
                iconAfter={<Download size={17} color="$textPrimary" />}
                onPress={() => void importFtp()}
              >
                {isImportingFtp ? 'Lecture des zones…' : 'Déduire de mes zones Strava'}
              </GradntButton>

              <XStack alignItems="center" gap="$3">
                <GradntInput
                  flex={1}
                  value={draftFtp}
                  onChangeText={setDraftFtp}
                  keyboardType="numeric"
                  placeholder="250"
                />
                <GradntText muted>W</GradntText>
                <GradntButton onPress={() => void saveFtp()}>Enregistrer</GradntButton>
              </XStack>

              {ftpMessage ? (
                <GradntText muted fontSize={12} lineHeight={18}>
                  {ftpMessage}
                </GradntText>
              ) : null}

              {ftpHistory.length > 1 ? (
                <GradntText muted fontSize={11} lineHeight={16}>
                  {ftpHistory.length} valeurs enregistrées depuis{' '}
                  {formatDate(Date.parse(ftpHistory[0]!.recordedAt), 'd MMMM yyyy', { locale: fr })}
                  .
                </GradntText>
              ) : null}
            </GradntCard>
          </YStack>

          <YStack gap="$4">
            <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
              TES DONNÉES
            </GradntText>

            <GradntCard gap="$3" padding="$4">
              <XStack alignItems="center" gap="$3">
                <ShieldCheck size={19} color="$recovery" />
                <GradntText weight="semibold">Ce qui est conservé</GradntText>
              </XStack>

              <GradntText muted fontSize={13} lineHeight={19}>
                Tes jetons d’accès Strava sont chiffrés dans le trousseau de cet appareil, avec ton
                profil et ton objectif saisis à l’inscription. GRADNT ne conserve rien sur ses
                serveurs : la fonction qui échange le code d’autorisation est sans état et n’écrit
                aucune donnée.
              </GradntText>

              <GradntText muted fontSize={13} lineHeight={19}>
                Déconnecter Strava efface les jetons et les sorties importées de cet appareil. Les
                activités elles-mêmes restent chez Strava, où tu gardes la main dessus.
              </GradntText>
            </GradntCard>
          </YStack>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
