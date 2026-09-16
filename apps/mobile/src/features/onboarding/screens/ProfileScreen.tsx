import { ArrowLeft, ArrowRight } from '@tamagui/lucide-icons-2'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'expo-router'
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
import { useOnboardingStore } from '../store/onboarding.store'
import { disciplines, experiences, volumes } from '../domain/profile.options'
import { cyclistProfileSchema, type CyclistProfileForm } from '../domain/profile.schema'

export function ProfileScreen() {
  const router = useRouter()
  const storedProfile = useOnboardingStore((state) => state.profile)
  const setProfile = useOnboardingStore((state) => state.setProfile)

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<CyclistProfileForm>({
    resolver: zodResolver(cyclistProfileSchema),
    mode: 'onChange',
    defaultValues: storedProfile ?? {
      discipline: 'road',
      experience: 'regular',
      weeklyVolume: '3to6',
    },
  })

  const submit = handleSubmit((values) => {
    setProfile(values)
    router.push('/onboarding/goal')
  })

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$7">
          <XStack alignItems="center" justifyContent="space-between">
            <GradntIconButton onPress={() => router.back()}>
              <ArrowLeft size={18} color={'$textPrimary'} />
            </GradntIconButton>

            <GradntText muted fontSize={12} weight="medium">
              2 / 6
            </GradntText>
          </XStack>

          <OnboardingProgress step={2} total={6} />

          <YStack gap="$2">
            <GradntHeading>Ton profil cycliste</GradntHeading>

            <GradntText muted>
              Donne-nous juste assez de contexte pour adapter les recommandations à ta pratique.
            </GradntText>
          </YStack>

          <YStack gap="$3">
            <GradntText weight="semibold">Ta pratique principale</GradntText>

            <Controller
              control={control}
              name="discipline"
              render={({ field }) => (
                <YStack gap="$2">
                  {disciplines.map((item) => {
                    const selected = field.value === item.value

                    return (
                      <GradntChoiceCard
                        key={item.value}
                        title={item.title}
                        description={item.description}
                        selected={selected}
                        onPress={() => {
                          field.onChange(item.value)
                        }}
                        icon={item.icon}
                      />
                    )
                  })}
                </YStack>
              )}
            />
          </YStack>

          <YStack gap="$3">
            <GradntText weight="semibold">Ton expérience</GradntText>

            <Controller
              control={control}
              name="experience"
              render={({ field }) => (
                <XStack gap="$2">
                  {experiences.map((item) => {
                    const selected = field.value === item.value

                    return (
                      <YStack key={item.value} flex={1}>
                        <GradntChoiceCard
                          title={item.label}
                          selected={selected}
                          onPress={() => {
                            field.onChange(item.value)
                          }}
                        />
                      </YStack>
                    )
                  })}
                </XStack>
              )}
            />
          </YStack>

          <YStack gap="$3">
            <GradntText weight="semibold">Volume hebdomadaire actuel</GradntText>

            <Controller
              control={control}
              name="weeklyVolume"
              render={({ field }) => (
                <XStack gap="$2" flexWrap="wrap">
                  {volumes.map((item) => (
                    <GradntButton
                      key={item.value}
                      tone={field.value === item.value ? 'primary' : 'secondary'}
                      minHeight={42}
                      onPress={() => {
                        field.onChange(item.value)
                      }}
                    >
                      {item.label}
                    </GradntButton>
                  ))}
                </XStack>
              )}
            />
          </YStack>

          <GradntButton
            disabled={!isValid}
            opacity={isValid ? 1 : 0.45}
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
