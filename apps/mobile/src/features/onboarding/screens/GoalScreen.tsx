import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Gauge,
  Mountain,
  Route,
  TrendingUp,
} from '@tamagui/lucide-icons-2'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntChoiceCard,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntMobileShell,
  GradntText,
} from '@/design-system'
import { colors } from '@/design-system/tokens'

import { OnboardingProgress } from '../components/OnboardingProgress'
import { cyclistGoalSchema, type CyclistGoalForm } from '../domain/goal.schema'
import { useOnboardingStore } from '../store/onboarding.store'

const goalTypes = [
  {
    value: 'ftp',
    title: 'Améliorer ma FTP',
    description: 'Développer ta puissance durable et suivre ta progression en watts.',
    icon: Gauge,
  },
  {
    value: 'distance',
    title: 'Rouler plus loin',
    description: 'Préparer une distance cible et améliorer ton endurance.',
    icon: Route,
  },
  {
    value: 'event',
    title: 'Préparer un événement',
    description: 'Construire ta progression autour d’une cyclosportive, course ou sortie.',
    icon: CalendarDays,
  },
  {
    value: 'climbing',
    title: 'Mieux grimper',
    description: 'Progresser dans les ascensions et accumuler davantage de dénivelé.',
    icon: Mountain,
  },
  {
    value: 'fitness',
    title: 'Progresser globalement',
    description: 'Rouler régulièrement et améliorer ta forme sans objectif chiffré précis.',
    icon: TrendingUp,
  },
] as const

function getTargetMeta(type: CyclistGoalForm['type']) {
  switch (type) {
    case 'ftp':
      return {
        label: 'FTP cible',
        placeholder: '280',
        unit: 'W',
        keyboardType: 'numeric' as const,
      }

    case 'distance':
      return {
        label: 'Distance cible',
        placeholder: '150',
        unit: 'km',
        keyboardType: 'numeric' as const,
      }

    case 'climbing':
      return {
        label: 'Dénivelé cible',
        placeholder: '2000',
        unit: 'm D+',
        keyboardType: 'numeric' as const,
      }

    default:
      return null
  }
}

export function GoalScreen() {
  const router = useRouter()

  const storedGoal = useOnboardingStore((state) => state.goal)

  const setGoal = useOnboardingStore((state) => state.setGoal)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid, errors },
  } = useForm<CyclistGoalForm>({
    resolver: zodResolver(cyclistGoalSchema),
    mode: 'onChange',
    defaultValues: storedGoal ?? {
      type: 'ftp',
      targetValue: '280',
      eventName: '',
    },
  })

  const selectedType = useWatch({
    control,
    name: 'type',
  })

  const targetMeta = getTargetMeta(selectedType)

  const selectGoal = (type: CyclistGoalForm['type']) => {
    setValue('type', type, {
      shouldValidate: true,
    })

    if (type === 'fitness') {
      setValue('targetValue', '', {
        shouldValidate: true,
      })
    }

    if (type !== 'event') {
      setValue('eventName', '', {
        shouldValidate: true,
      })
    }
  }

  const submit = handleSubmit((values) => {
    setGoal(values)

    router.push('/onboarding/availability')
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
              3 / 6
            </GradntText>
          </XStack>

          <OnboardingProgress step={3} total={6} />

          <YStack gap="$2">
            <GradntHeading>Qu&apos;est-ce qui te motive ?</GradntHeading>

            <GradntText muted>
              Choisis ton objectif principal. GRADNT adaptera ensuite ton plan autour de cette
              priorité.
            </GradntText>
          </YStack>

          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <YStack gap="$2">
                {goalTypes.map((goal) => {
                  const Icon = goal.icon
                  const selected = field.value === goal.value

                  return (
                    <GradntChoiceCard
                      key={goal.value}
                      title={goal.title}
                      description={goal.description}
                      selected={selected}
                      onPress={() => {
                        selectGoal(goal.value)
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

          {targetMeta ? (
            <YStack gap="$2">
              <GradntText weight="semibold">{targetMeta.label}</GradntText>

              <XStack alignItems="center" gap="$2">
                <YStack flex={1}>
                  <Controller
                    control={control}
                    name="targetValue"
                    render={({ field }) => (
                      <GradntInput
                        value={field.value}
                        onChangeText={field.onChange}
                        placeholder={targetMeta.placeholder}
                        keyboardType={targetMeta.keyboardType}
                      />
                    )}
                  />
                </YStack>

                <YStack
                  minWidth={56}
                  minHeight={52}
                  paddingHorizontal="$3"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={1}
                  borderColor="$border"
                  borderRadius={16}
                  backgroundColor="$backgroundElevated"
                >
                  <GradntText muted weight="semibold" fontSize={13}>
                    {targetMeta.unit}
                  </GradntText>
                </YStack>
              </XStack>

              {errors.targetValue ? (
                <GradntText color="$danger" fontSize={12}>
                  {errors.targetValue.message}
                </GradntText>
              ) : null}
            </YStack>
          ) : null}

          {selectedType === 'event' ? (
            <YStack gap="$2">
              <GradntText weight="semibold">Ton événement</GradntText>

              <Controller
                control={control}
                name="eventName"
                render={({ field }) => (
                  <GradntInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Ex. Étape du Tour"
                  />
                )}
              />

              {errors.eventName ? (
                <GradntText color="$danger" fontSize={12}>
                  {errors.eventName.message}
                </GradntText>
              ) : null}
            </YStack>
          ) : null}

          {selectedType === 'fitness' ? (
            <YStack
              padding="$4"
              borderRadius={18}
              borderWidth={1}
              borderColor="$border"
              backgroundColor="$backgroundElevated"
            >
              <GradntText muted fontSize={13} lineHeight={19}>
                Aucun chiffre obligatoire. GRADNT privilégiera la régularité, la forme et une
                progression équilibrée.
              </GradntText>
            </YStack>
          ) : null}

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
