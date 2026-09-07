import { ArrowLeft, ArrowRight, Bike, Mountain, Route } from '@tamagui/lucide-icons-2'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntChoiceCard,
  GradntHeading,
  GradntIconButton,
  GradntMobileShell,
  GradntText,
} from '@/design-system'
import { colors } from '@/design-system/tokens'

import { OnboardingProgress } from '../components/OnboardingProgress'
import { cyclistProfileSchema, type CyclistProfileForm } from '../domain/profile.schema'

const disciplines = [
  {
    value: 'road',
    title: 'Route',
    description: 'Performance, endurance et sorties sur route.',
    icon: Route,
  },
  {
    value: 'gravel',
    title: 'Gravel',
    description: 'Route et chemins, avec plus de liberté.',
    icon: Bike,
  },
  {
    value: 'mtb',
    title: 'VTT',
    description: 'Sentiers, technique et dénivelé.',
    icon: Mountain,
  },
] as const

const experiences = [
  {
    value: 'beginner',
    label: 'Débutant',
  },
  {
    value: 'regular',
    label: 'Régulier',
  },
  {
    value: 'advanced',
    label: 'Avancé',
  },
] as const

const volumes = [
  {
    value: 'lt3',
    label: '< 3 h',
  },
  {
    value: '3to6',
    label: '3–6 h',
  },
  {
    value: '6to10',
    label: '6–10 h',
  },
  {
    value: 'gt10',
    label: '10 h+',
  },
] as const

export function ProfileScreen() {
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { isValid },
  } = useForm<CyclistProfileForm>({
    resolver: zodResolver(cyclistProfileSchema),
    mode: 'onChange',
    defaultValues: {
      discipline: 'road',
      experience: 'regular',
      weeklyVolume: '3to6',
    },
  })

  const submit = handleSubmit(() => {
    router.push('/onboarding/goal')
  })

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
                    const Icon = item.icon
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
                        icon={
                          <Icon size={18} color={selected ? colors.graphite950 : colors.stone400} />
                        }
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
      </ScrollView>
    </GradntMobileShell>
  )
}
