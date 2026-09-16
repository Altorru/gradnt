import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  Pencil,
  RefreshCw,
  ShieldCheck,
  Trash2,
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
  GradntChip,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntStravaConnectBlock,
  GradntText,
} from '@/design-system'
import { useTranslation } from '@/i18n'
import { STRAVA_ERROR_KEYS } from '@/features/onboarding/domain/strava.schema'
import { usePreferencesStore } from '@/features/app/store/preferences.store'
import { stravaService } from '@/features/onboarding/services/strava.service'
import { goalTypeLabels } from '@/features/onboarding/domain/goal.options'
import { describeProfile } from '@/features/onboarding/domain/profile.options'
import {
  deduceFtpFromStrava,
  editFtp,
  loadFtpHistory,
  removeFtp,
  saveFtp as saveFtpValue,
} from '@/services/ftp/ftp.service'
import type { FtpEntry, FtpSource } from '@/services/ftp/ftp.persistence'
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

/**
 * A labelled row of choices.
 *
 * Chips rather than the option list used elsewhere: these are three short words
 * a rider flips between, and a column of three rows twice over would push the
 * rest of the screen below the fold for two settings.
 */
function SettingsChoice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <YStack gap="$2">
      <GradntText muted fontSize={13} weight="semibold">
        {label}
      </GradntText>

      <XStack gap="$2" flexWrap="wrap">
        {options.map((option) => (
          <GradntChip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </XStack>
    </YStack>
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
  const { t } = useTranslation()
  const language = usePreferencesStore((state) => state.language)
  const appearance = usePreferencesStore((state) => state.appearance)
  const setLanguage = usePreferencesStore((state) => state.setLanguage)
  const setAppearance = usePreferencesStore((state) => state.setAppearance)
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
  /**
   * Where the value currently in the field came from.
   *
   * A figure left exactly as it was deduced is Strava's; one the rider typed or
   * corrected is theirs. Losing the distinction would record an inference as a
   * measurement.
   */
  const [draftedSource, setDraftedSource] = useState<FtpSource>('declared')
  const [isReadingZones, setIsReadingZones] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  /** The reading being corrected, or null when the field is a new one. */
  const [editingRecordedAt, setEditingRecordedAt] = useState<string | null>(null)
  /**
   * One place for both outcomes.
   *
   * The field is pre-filled from what is on record, so pressing Save without
   * changing anything used to hit the "unchanged" guard and return in silence —
   * a button that appears dead. Every press now says what it did.
   */
  const [ftpFeedback, setFtpFeedback] = useState<{
    tone: 'ok' | 'error'
    text: string
  } | null>(null)

  const refreshHistory = async () => {
    const history = await loadFtpHistory()
    setFtpHistory(history)
    return history
  }

  useEffect(() => {
    void loadFtpHistory().then((history) => {
      setFtpHistory(history)

      // An empty field beside a stated value reads as though nothing were
      // saved. It starts from what is on record, ready to be corrected.
      const latest = history.at(-1)

      if (latest !== undefined) {
        setDraftFtp(String(latest.value))
        setDraftedSource(latest.source)
      }
    })
  }, [])

  const latestFtp = ftpHistory.at(-1) ?? null

  const deduceFtp = async () => {
    setIsReadingZones(true)
    setFtpFeedback(null)

    const result = await deduceFtpFromStrava()

    if (result.status === 'deduced') {
      // Pre-filled rather than saved. The figure is inverted from zone
      // boundaries, so it belongs in front of the rider before it becomes the
      // number every other figure is measured against.
      setDraftFtp(String(result.value))
      setDraftedSource('strava')
      setFtpFeedback({ tone: 'ok', text: `${result.value} W déduits. Il reste à enregistrer.` })
    } else if (result.status === 'noPowerZones') {
      // The common case, not a failure: most riders have never set an FTP in
      // Strava, and there is an obvious thing for them to do about it.
      setFtpFeedback({ tone: 'error', text: 'Strava n’a pas de zones de puissance pour toi.' })
    } else if (result.status === 'unrecognized') {
      // Not the rider's problem, and not something to describe as one.
      setFtpFeedback({
        tone: 'error',
        text: `Réponse inattendue de Strava (${result.summary}).`,
      })
    } else {
      setFtpFeedback({ tone: 'error', text: 'La lecture de tes zones a échoué.' })
    }

    setIsReadingZones(false)
  }

  const startEditing = (entry: FtpEntry) => {
    setDraftFtp(String(entry.value))
    setDraftedSource(entry.source)
    setEditingRecordedAt(entry.recordedAt)
    setFtpFeedback(null)
  }

  const cancelEditing = () => {
    const latest = ftpHistory.at(-1)

    setEditingRecordedAt(null)
    setDraftFtp(latest === undefined ? '' : String(latest.value))
    setDraftedSource(latest?.source ?? 'declared')
    setFtpFeedback(null)
  }

  const removeEntry = async (entry: FtpEntry) => {
    await removeFtp(entry.recordedAt)
    const history = await refreshHistory()

    // The reading being corrected is gone, so the field goes back to what is
    // left rather than holding a value that no longer exists.
    if (editingRecordedAt === entry.recordedAt) {
      const latest = history.at(-1)
      setEditingRecordedAt(null)
      setDraftFtp(latest === undefined ? '' : String(latest.value))
      setDraftedSource(latest?.source ?? 'declared')
    }

    setFtpFeedback({ tone: 'ok', text: 'Relevé supprimé.' })
  }

  const saveFtp = async () => {
    const parsed = Math.round(Number(draftFtp))

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setFtpFeedback({ tone: 'error', text: 'Indique une valeur en watts.' })
      return
    }

    if (editingRecordedAt !== null) {
      await editFtp(editingRecordedAt, parsed, draftedSource)
      await refreshHistory()
      setEditingRecordedAt(null)
      setFtpFeedback({ tone: 'ok', text: 'Relevé corrigé.' })
      return
    }

    // The field holds the recorded value, so saving it unchanged is not a new
    // reading — the history is read as a progression, and repeated identical
    // entries would flatten it. It still has to say so.
    if (latestFtp !== null && latestFtp.value === parsed && latestFtp.source === draftedSource) {
      setFtpFeedback({ tone: 'ok', text: 'Cette valeur est déjà enregistrée.' })
      return
    }

    await saveFtpValue(parsed, draftedSource)
    await refreshHistory()
    setFtpFeedback({ tone: 'ok', text: 'FTP enregistrée.' })
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
      setError(t(STRAVA_ERROR_KEYS[result.error.code], result.error.params))
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
            <GradntIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
              <ArrowLeft size={18} color="$textPrimary" />
            </GradntIconButton>
            <GradntHeading>{t('settings.title')}</GradntHeading>
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

          {/* First, because it is about the app rather than about the rider's
              data — and because it is what someone hunts for when the screen
              is in a language they did not choose. */}
          <YStack gap="$4">
            <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
              {t('settings.appearanceAndLanguage')}
            </GradntText>

            <GradntCard gap="$4" padding="$4">
              <SettingsChoice
                label={t('settings.theme')}
                value={appearance}
                onChange={setAppearance}
                options={[
                  { value: 'system', label: t('settings.themeSystem') },
                  { value: 'light', label: t('settings.themeLight') },
                  { value: 'dark', label: t('settings.themeDark') },
                ]}
              />

              <SettingsChoice
                label={t('settings.language')}
                value={language}
                onChange={setLanguage}
                options={[
                  { value: 'system', label: t('settings.languageSystem') },
                  { value: 'fr', label: t('languages.fr') },
                  { value: 'en', label: t('languages.en') },
                ]}
              />
            </GradntCard>
          </YStack>

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
                value={describeProfile(storedProfile, t)}
                onPress={() => router.push('/settings/profile')}
              />

              <SettingsRow
                label="Objectif"
                value={storedGoal ? goalTypeLabels(t)[storedGoal.type] : t('settings.notSet')}
                onPress={() => router.push('/settings/goal')}
              />
            </GradntCard>
          </YStack>

          <YStack gap="$4">
            <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
              PUISSANCE
            </GradntText>

            <GradntCard gap="$4" padding="$4">
              {/* The header doubles as the control that reveals the history:
                  there is nothing else to do with the block, and a chevron on
                  its own would be a second thing to aim at. */}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Historique de la FTP"
                accessibilityState={{ expanded: isHistoryOpen }}
                disabled={ftpHistory.length === 0}
                onPress={() => setIsHistoryOpen((open) => !open)}
                hitSlop={8}
              >
                {({ pressed }) => (
                  <XStack
                    alignItems="center"
                    justifyContent="space-between"
                    gap="$3"
                    opacity={pressed ? 0.6 : 1}
                  >
                    <YStack flex={1} gap="$1">
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

                    {ftpHistory.length > 0 ? (
                      isHistoryOpen ? (
                        <ChevronDown size={17} color="$textSecondary" />
                      ) : (
                        <ChevronRight size={17} color="$textSecondary" />
                      )
                    ) : null}
                  </XStack>
                )}
              </Pressable>

              {isHistoryOpen ? (
                <YStack gap="$3">
                  {[...ftpHistory].reverse().map((entry) => (
                    <XStack
                      key={entry.recordedAt}
                      alignItems="center"
                      justifyContent="space-between"
                      gap="$3"
                    >
                      {/* Tapping a reading loads it into the field to correct
                          it, which is the only edit that makes sense: the date
                          is when it happened and is not the rider's to move. */}
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Corriger le relevé de ${entry.value} watts`}
                        onPress={() => startEditing(entry)}
                        style={{ flex: 1 }}
                      >
                        {({ pressed }) => (
                          <XStack
                            alignItems="center"
                            gap="$3"
                            opacity={pressed ? 0.6 : 1}
                            borderWidth={1}
                            borderColor={
                              editingRecordedAt === entry.recordedAt ? '$accent' : 'transparent'
                            }
                            borderRadius={14}
                            paddingHorizontal="$2"
                            paddingVertical="$2"
                          >
                            <YStack flex={1} gap="$1">
                              <GradntText weight="semibold">{entry.value} W</GradntText>
                              <GradntText muted fontSize={12}>
                                {entry.source === 'strava' ? 'Déduite de Strava' : 'Saisie'} ·{' '}
                                {formatDate(Date.parse(entry.recordedAt), 'd MMM yyyy', {
                                  locale: fr,
                                })}
                              </GradntText>
                            </YStack>

                            <Pencil size={15} color="$textSecondary" />
                          </XStack>
                        )}
                      </Pressable>

                      <GradntIconButton
                        accessibilityLabel={`Supprimer le relevé de ${entry.value} watts`}
                        onPress={() => void removeEntry(entry)}
                      >
                        <Trash2 size={16} color="$danger" />
                      </GradntIconButton>
                    </XStack>
                  ))}

                  <GradntText muted fontSize={11} lineHeight={16}>
                    Touche un relevé pour le corriger.
                  </GradntText>
                </YStack>
              ) : null}

              <GradntButton
                tone="secondary"
                disabled={isReadingZones}
                opacity={isReadingZones ? 0.55 : 1}
                iconAfter={<Download size={17} color="$textPrimary" />}
                onPress={() => void deduceFtp()}
              >
                {isReadingZones ? 'Lecture des zones…' : 'Déduire de mes zones Strava'}
              </GradntButton>

              {editingRecordedAt !== null ? (
                <XStack alignItems="center" justifyContent="space-between" gap="$3">
                  <GradntText color="$accentInk" weight="semibold" fontSize={12}>
                    Correction d’un relevé existant
                  </GradntText>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Annuler la correction"
                    onPress={cancelEditing}
                    hitSlop={8}
                  >
                    {({ pressed }) => (
                      <GradntText muted fontSize={12} opacity={pressed ? 0.6 : 1}>
                        Annuler
                      </GradntText>
                    )}
                  </Pressable>
                </XStack>
              ) : null}

              <XStack alignItems="center" gap="$3">
                <GradntInput
                  flex={1}
                  value={draftFtp}
                  onChangeText={(value) => {
                    setDraftFtp(value)
                    // Edited, so it is theirs now — however it was filled in.
                    setDraftedSource('declared')
                    setFtpFeedback(null)
                  }}
                  keyboardType="numeric"
                  placeholder="250"
                />
                <GradntText muted>W</GradntText>
                <GradntButton onPress={() => void saveFtp()}>
                  {editingRecordedAt !== null ? 'Corriger' : 'Enregistrer'}
                </GradntButton>
              </XStack>

              {ftpFeedback ? (
                <GradntText
                  color={ftpFeedback.tone === 'error' ? '$danger' : '$positive'}
                  fontSize={12}
                  lineHeight={18}
                >
                  {ftpFeedback.text}
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
