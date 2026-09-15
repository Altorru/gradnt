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
  const storedAvailability = useOnboardingStore((state) => state.availability)
  const setAvailability = useOnboardingStore((state) => state.setAvailability)

  const { control, handleSubmit, setValue } = useForm<AvailabilityFormValues>({
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

  const submit = handleSubmit((values) => {
    setAvailability(values.slots)
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
          <XStack alignItems="center" justifyContent="space-between">
            <GradntIconButton onPress={() => router.back()}>
              <ArrowLeft size={18} color={colors.bone100} />
            </GradntIconButton>

            <GradntText muted fontSize={12} weight="medium">
              4 / 6
            </GradntText>
          </XStack>

          <OnboardingProgress step={4} total={6} />

          <YStack gap="$2">
            <GradntHeading>Quand peux-tu rouler ?</GradntHeading>

            <GradntText muted>
              Indique tes créneaux habituels. On gardera de la flexibilité pour les imprévus et la
              récupération.
            </GradntText>
          </YStack>

          <YStack gap="$3">
            {visibleSlots.map((slot, index) => (
              <YStack key={slot.day} gap="$2">
                <GradntChoiceCard
                  title={weekdayLabels[slot.day]}
                  description={slot.available ? 'Disponible pour une séance' : 'Jour de repos'}
                  selected={slot.available}
                  onPress={() => {
                    updateSlot(index, {
                      available: !slot.available,
                      durationMinutes: slot.available ? null : 60,
                    })
                  }}
                  icon={
                    <Clock3
                      size={18}
                      color={slot.available ? colors.graphite950 : colors.stone400}
                    />
                  }
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
                        {durationLabels[duration]}
                      </GradntButton>
                    ))}
                  </XStack>
                ) : null}
              </YStack>
            ))}
          </YStack>

          {!hasAvailableDay ? (
            <GradntText color="$danger" fontSize={12}>
              Sélectionne au moins un jour disponible.
            </GradntText>
          ) : null}

          <GradntButton
            disabled={!canContinue}
            opacity={canContinue ? 1 : 0.45}
            iconAfter={<ArrowRight size={18} color={colors.graphite950} />}
            onPress={submit}
          >
            Continuer
          </GradntButton>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
