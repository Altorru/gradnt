import { OnboardingSaveFeedback } from '../components/OnboardingSaveFeedback'
import { ArrowLeft, ArrowRight, Clock3 } from '@tamagui/lucide-icons-2'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'expo-router'
import { useForm, useWatch } from 'react-hook-form'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntChoiceCard,
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
  availabilityDurationMinutes,
  defaultWeeklyAvailability,
  durationLabels,
  weekdayLabels,
  weeklyAvailabilityFormSchema,
  type WeeklyAvailabilityForm,
} from '../domain/availability.schema'
import { useOnboardingStore } from '../store/onboarding.store'

type AvailabilityFormValues = {
  slots: WeeklyAvailabilityForm
}

export function AvailabilityScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const storedAvailability = useOnboardingStore((state) => state.availability)
  const setAvailability = useOnboardingStore((state) => state.setAvailability)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<AvailabilityFormValues>({
    resolver: zodResolver(weeklyAvailabilityFormSchema),
    mode: 'onChange',
    defaultValues: {
      slots: storedAvailability ?? defaultWeeklyAvailability,
    },
  })

  const slots = useWatch({
    control,
    name: 'slots',
  })

  const updateSlot = (index: number, updates: Partial<WeeklyAvailabilityForm[number]>) => {
    const currentSlots = slots ?? defaultWeeklyAvailability

    setValue(
      'slots',
      currentSlots.map((slot, slotIndex) => (slotIndex === index ? { ...slot, ...updates } : slot)),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    )
  }

  const submit = handleSubmit(async (values) => {
    if (!(await setAvailability(values.slots))) return
    router.push('/onboarding/strava')
  })

  const visibleSlots = slots ?? defaultWeeklyAvailability
  const hasAvailableDay = visibleSlots.some((slot) => slot.available)
  const hasIncompleteDay = visibleSlots.some(
    (slot) => slot.available && slot.durationMinutes === null,
  )
  const canContinue = hasAvailableDay && !hasIncompleteDay

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$7">
          <OnboardingSaveFeedback />
          <XStack alignItems="center" justifyContent="space-between">
            <GradntIconButton onPress={() => router.back()}>
              <ArrowLeft size={18} color={'$textPrimary'} />
            </GradntIconButton>

            <GradntText muted fontSize={12} weight="medium">
              4 / 7
            </GradntText>
          </XStack>

          <OnboardingProgress step={4} total={7} />

          <YStack gap="$2">
            <GradntHeading>{t('onboarding.availability.title')}</GradntHeading>

            <GradntText muted>{t('onboarding.availability.subtitle')}</GradntText>
          </YStack>

          <YStack gap="$3">
            {visibleSlots.map((slot, index) => (
              <YStack key={slot.day} gap="$2">
                <GradntChoiceCard
                  title={weekdayLabels(t)[slot.day]}
                  description={
                    slot.available
                      ? t('onboarding.availability.available')
                      : t('onboarding.availability.rest')
                  }
                  selected={slot.available}
                  onPress={() => {
                    updateSlot(index, {
                      available: !slot.available,
                      durationMinutes: slot.available ? null : 60,
                    })
                  }}
                  icon={Clock3}
                />

                {slot.available ? (
                  <XStack gap="$2" flexWrap="wrap" paddingLeft="$3">
                    {availabilityDurationMinutes.map((duration) => (
                      <GradntButton
                        key={duration}
                        tone={slot.durationMinutes === duration ? 'primary' : 'secondary'}
                        minHeight={40}
                        paddingHorizontal="$3"
                        onPress={() => {
                          updateSlot(index, { durationMinutes: duration })
                        }}
                      >
                        {durationLabels(t)[duration]}
                      </GradntButton>
                    ))}
                  </XStack>
                ) : null}
              </YStack>
            ))}
          </YStack>

          {!hasAvailableDay ? (
            <GradntText color="$danger" fontSize={12}>
              {t('onboarding.availability.errors.noDay')}
            </GradntText>
          ) : null}

          <GradntButton
            disabled={!canContinue || isSubmitting}
            opacity={canContinue ? 1 : 0.45}
            iconAfter={<ArrowRight size={18} color={colors.graphite950} />}
            onPress={submit}
          >
            {t('common.continue')}
          </GradntButton>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
