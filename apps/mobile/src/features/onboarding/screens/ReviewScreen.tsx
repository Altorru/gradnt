import { OnboardingSaveFeedback } from '../components/OnboardingSaveFeedback'
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

import { useTranslation } from '@/i18n'

import { OnboardingProgress } from '../components/OnboardingProgress'
import { durationLabels, weekdayLabels } from '../domain/availability.schema'
import { goalTypes } from '../domain/goal.options'
import { disciplines, experiences, labelOf, volumes } from '../domain/profile.options'
import { useOnboardingStore } from '../store/onboarding.store'

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
  const saving = useOnboardingStore((state) => state.saving)
  const router = useRouter()
  const { t } = useTranslation()
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
        return weekdayLabels(t)[slot.day]
      }

      return `${weekdayLabels(t)[slot.day]} · ${durationLabels(t)[duration as keyof ReturnType<typeof durationLabels>]}`
    })
    .join(', ')

  const goalSummary = goal
    ? goal.type === 'event'
      ? `${labelOf(goalTypes(t), goal.type)} · ${goal.eventName}`
      : goal.type === 'fitness'
        ? labelOf(goalTypes(t), goal.type)
        : `${labelOf(goalTypes(t), goal.type)} · ${goal.targetValue}`
    : t('onboarding.review.goalEmpty')

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
              7 / 8
            </GradntText>
          </XStack>

          <OnboardingProgress step={7} total={8} />

          <YStack gap="$2">
            <GradntHeading>{t('onboarding.review.title')}</GradntHeading>

            <GradntText muted>{t('onboarding.review.subtitle')}</GradntText>
          </YStack>

          <GradntCard gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntText weight="semibold">{t('onboarding.review.profileCard')}</GradntText>
              <GradntBadge tone="positive">{t('onboarding.review.ready')}</GradntBadge>
            </XStack>

            {profile ? (
              <YStack gap="$3">
                <SummaryRow
                  label={t('onboarding.review.practice')}
                  value={labelOf(disciplines(t), profile.discipline)}
                />
                <SummaryRow
                  label={t('onboarding.review.experience')}
                  value={labelOf(experiences(t), profile.experience)}
                />
                <SummaryRow
                  label={t('onboarding.review.volume')}
                  value={labelOf(volumes(t), profile.weeklyVolume)}
                />
              </YStack>
            ) : (
              <GradntText muted fontSize={13}>
                {t('onboarding.review.profileEmpty')}
              </GradntText>
            )}
          </GradntCard>

          <GradntCard gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntText weight="semibold">{t('onboarding.review.goalCard')}</GradntText>
              <GradntBadge tone="positive">{t('onboarding.review.ready')}</GradntBadge>
            </XStack>
            <SummaryRow label={t('onboarding.review.goal')} value={goalSummary} />
          </GradntCard>

          <GradntCard gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntText weight="semibold">{t('onboarding.review.availabilityCard')}</GradntText>
              <GradntBadge tone="positive">{t('onboarding.review.ready')}</GradntBadge>
            </XStack>
            <GradntText muted fontSize={13} lineHeight={20}>
              {availabilitySummary || t('onboarding.review.noDay')}
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
                <GradntText weight="semibold">{t('onboarding.review.stravaCard')}</GradntText>
                <GradntText muted fontSize={12}>
                  {strava?.status === 'connected'
                    ? t('onboarding.strava.badgeConnected')
                    : strava?.status === 'deferred'
                      ? t('onboarding.review.stravaDeferred')
                      : t('onboarding.review.stravaMissing')}
                </GradntText>
              </YStack>
              <ChevronRight size={17} color={'$textSecondary'} />
            </XStack>
          </GradntCard>

          <YStack gap="$3">
            <GradntText muted textAlign="center" fontSize={13} lineHeight={20}>
              {t('onboarding.review.footnote')}
            </GradntText>

            <GradntButton
              iconAfter={<ChevronRight size={18} color={colors.graphite950} />}
              disabled={saving}
              onPress={() => router.push('/onboarding/account')}
            >
              {t('onboarding.review.account')}
            </GradntButton>

            <GradntButton
              tone="ghost"
              minHeight={44}
              disabled={saving}
              onPress={async () => {
                if (!(await reset())) return
                // Dismisses the flow rather than landing on top of it. Left in
                // place, every screen just walked through comes back at the
                // first back press.
                router.dismissTo('/onboarding')
              }}
            >
              {t('onboarding.review.restart')}
            </GradntButton>
          </YStack>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
