import { ArrowLeft, Check, ChevronRight } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
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

import { OnboardingProgress } from '../components/OnboardingProgress'
import { durationLabels, weekdayLabels } from '../domain/availability.schema'
import { useOnboardingStore } from '../store/onboarding.store'

const disciplineLabels = {
  road: 'Route',
  gravel: 'Gravel',
  mtb: 'VTT',
} as const

const experienceLabels = {
  beginner: 'Débutant',
  regular: 'Régulier',
  advanced: 'Avancé',
} as const

const volumeLabels = {
  lt3: '< 3 h',
  '3to6': '3–6 h',
  '6to10': '6–10 h',
  gt10: '10 h+',
} as const

const goalLabels = {
  ftp: 'Améliorer ma FTP',
  distance: 'Rouler plus loin',
  event: 'Préparer un événement',
  climbing: 'Mieux grimper',
  fitness: 'Progresser globalement',
} as const

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justifyContent="space-between" gap="$3" alignItems="center">
      <GradntText muted fontSize={13}>
        {label}
      </GradntText>
      <GradntText weight="semibold" fontSize={13} textAlign="right" flex={1}>
        {value}
      </GradntText>
    </XStack>
  )
}

export function ReviewScreen() {
  const router = useRouter()
  const complete = useOnboardingStore((state) => state.complete)
  const reset = useOnboardingStore((state) => state.reset)
  const profile = useOnboardingStore((state) => state.profile)
  const goal = useOnboardingStore((state) => state.goal)
  const availability = useOnboardingStore((state) => state.availability)
  const strava = useOnboardingStore((state) => state.strava)

  const availableDays = (availability ?? []).filter((slot) => slot.available)
  const availabilitySummary = availableDays
    .map((slot) => {
      const duration = slot.durationMinutes

      if (duration === null) {
        return weekdayLabels[slot.day]
      }

      return `${weekdayLabels[slot.day]} · ${durationLabels[duration as keyof typeof durationLabels]}`
    })
    .join(', ')

  const goalSummary = goal
    ? goal.type === 'event'
      ? `${goalLabels[goal.type]} · ${goal.eventName}`
      : goal.type === 'fitness'
        ? goalLabels[goal.type]
        : `${goalLabels[goal.type]} · ${goal.targetValue}`
    : 'À compléter'

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$7">
          <XStack alignItems="center" justifyContent="space-between">
            <GradntIconButton onPress={() => router.back()}>
              <ArrowLeft size={18} color={'$textPrimary'} />
            </GradntIconButton>

            <GradntText muted fontSize={12} weight="medium">
              6 / 6
            </GradntText>
          </XStack>

          <OnboardingProgress step={6} total={6} />

          <YStack gap="$2">
            <GradntHeading>Ton point de départ</GradntHeading>

            <GradntText muted>
              Voici le contexte que GRADNT utilisera pour construire une première base cohérente.
            </GradntText>
          </YStack>

          <GradntCard gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntText weight="semibold">Profil cycliste</GradntText>
              <GradntBadge tone="positive">Prêt</GradntBadge>
            </XStack>

            {profile ? (
              <YStack gap="$3">
                <SummaryRow label="Pratique" value={disciplineLabels[profile.discipline]} />
                <SummaryRow label="Expérience" value={experienceLabels[profile.experience]} />
                <SummaryRow label="Volume actuel" value={volumeLabels[profile.weeklyVolume]} />
              </YStack>
            ) : (
              <GradntText muted fontSize={13}>
                Profil non renseigné.
              </GradntText>
            )}
          </GradntCard>

          <GradntCard gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntText weight="semibold">Objectif principal</GradntText>
              <GradntBadge tone="positive">Prêt</GradntBadge>
            </XStack>
            <SummaryRow label="Objectif" value={goalSummary} />
          </GradntCard>

          <GradntCard gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntText weight="semibold">Disponibilités</GradntText>
              <GradntBadge tone="positive">Prêt</GradntBadge>
            </XStack>
            <GradntText muted fontSize={13} lineHeight={20}>
              {availabilitySummary || 'Aucun jour sélectionné'}
            </GradntText>
          </GradntCard>

          <GradntCard gap="$3">
            <XStack alignItems="center" gap="$3">
              <YStack
                width={32}
                height={32}
                borderRadius={10}
                alignItems="center"
                justifyContent="center"
                backgroundColor="$backgroundSubtle"
              >
                <Check
                  size={17}
                  color={strava?.status === 'connected' ? '$positive' : '$textSecondary'}
                />
              </YStack>
              <YStack flex={1} gap="$1">
                <GradntText weight="semibold">Historique Strava</GradntText>
                <GradntText muted fontSize={12}>
                  {strava?.status === 'connected'
                    ? 'Connecté'
                    : strava?.status === 'deferred'
                      ? 'À connecter plus tard'
                      : 'Pas encore connecté'}
                </GradntText>
              </YStack>
              <ChevronRight size={17} color={'$textSecondary'} />
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            <GradntText muted textAlign="center" fontSize={13} lineHeight={20}>
              GRADNT est prêt à construire ton point de départ. Aucune analyse automatique n’a été
              lancée pour le moment.
            </GradntText>

            <GradntButton
              iconAfter={<ChevronRight size={18} color={colors.graphite950} />}
              onPress={() => {
                complete()
                router.replace('/home')
              }}
            >
              Entrer dans GRADNT
            </GradntButton>

            <GradntButton
              tone="ghost"
              minHeight={44}
              onPress={() => {
                void reset()
                router.replace('/onboarding')
              }}
            >
              Recommencer l&apos;onboarding
            </GradntButton>
          </YStack>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
