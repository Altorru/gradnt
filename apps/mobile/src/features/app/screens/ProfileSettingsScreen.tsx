import { OnboardingSaveFeedback } from '@/features/onboarding/components/OnboardingSaveFeedback'
import type { CyclistProfileForm } from '@/features/onboarding/domain/profile.schema'

import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Controller, useForm } from 'react-hook-form'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntChoiceCard,
  GradntChip,
  GradntHeading,
  GradntIconButton,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { useTranslation } from '@/i18n'
import { disciplines, experiences, volumes } from '@/features/onboarding/domain/profile.options'
import { cyclistProfileSchema } from '@/features/onboarding/domain/profile.schema'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'

/**
 * Edits the cyclist profile outside the onboarding flow.
 *
 * Same schema and same vocabulary as the onboarding step, without its progress
 * chrome. The profile feeds the generated plan, so the plan is refetched with
 * it — otherwise the schedule would keep describing the previous answers.
 */
export function ProfileSettingsScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const storedProfile = useOnboardingStore((state) => state.profile)
  const setProfile = useOnboardingStore((state) => state.setProfile)

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CyclistProfileForm>({
    resolver: zodResolver(cyclistProfileSchema),
    defaultValues: storedProfile ?? {
      discipline: 'road',
      experience: 'regular',
      weeklyVolume: '3to6',
    },
  })

  const save = handleSubmit(async (values) => {
    if (!(await setProfile(values))) return

    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['athlete'] }),
      queryClient.refetchQueries({ queryKey: ['training-plan-update'] }),
      queryClient.refetchQueries({ queryKey: ['training-plan'] }),
      queryClient.refetchQueries({ queryKey: ['upcoming-workouts'] }),
    ])

    router.back()
  })

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$6">
          <OnboardingSaveFeedback />
          <XStack alignItems="center" gap="$3">
            <GradntIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
              <ArrowLeft size={18} color="$textPrimary" />
            </GradntIconButton>
            <GradntHeading>{t('settings.profileTitle')}</GradntHeading>
          </XStack>

          <Controller
            control={control}
            name="discipline"
            render={({ field }) => (
              <YStack gap="$3">
                <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                  {t('settings.discipline')}
                </GradntText>

                {disciplines(t).map((discipline) => (
                  <GradntChoiceCard
                    key={discipline.value}
                    title={discipline.title}
                    description={discipline.description}
                    icon={discipline.icon}
                    selected={field.value === discipline.value}
                    onPress={() => field.onChange(discipline.value)}
                  />
                ))}
              </YStack>
            )}
          />

          <Controller
            control={control}
            name="experience"
            render={({ field }) => (
              <YStack gap="$3">
                <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                  {t('settings.experience')}
                </GradntText>

                <XStack gap="$2" flexWrap="wrap">
                  {experiences(t).map((experience) => (
                    <GradntChip
                      key={experience.value}
                      label={experience.label}
                      selected={field.value === experience.value}
                      onPress={() => field.onChange(experience.value)}
                    />
                  ))}
                </XStack>
              </YStack>
            )}
          />

          <Controller
            control={control}
            name="weeklyVolume"
            render={({ field }) => (
              <YStack gap="$3">
                <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                  {t('settings.weeklyVolume')}
                </GradntText>

                <XStack gap="$2" flexWrap="wrap">
                  {volumes(t).map((volume) => (
                    <GradntChip
                      key={volume.value}
                      label={volume.label}
                      selected={field.value === volume.value}
                      onPress={() => field.onChange(volume.value)}
                    />
                  ))}
                </XStack>
              </YStack>
            )}
          />

          <GradntButton disabled={isSubmitting} onPress={() => void save()}>
            {t('settings.save')}
          </GradntButton>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
