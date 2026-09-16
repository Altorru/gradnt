import type { CyclistGoalForm } from '@/features/onboarding/domain/goal.schema'

import { ArrowLeft } from '@tamagui/lucide-icons-2'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntChoiceCard,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { getTargetMeta, goalTypes } from '@/features/onboarding/domain/goal.options'
import { cyclistGoalSchema } from '@/features/onboarding/domain/goal.schema'
import { useOnboardingStore } from '@/features/onboarding/store/onboarding.store'

/**
 * Edits the goal outside the onboarding flow.
 *
 * Same schema and same vocabulary as the onboarding step, without its progress
 * chrome: changing a goal later must not walk a rider who has already signed up
 * back through sign-up.
 */
export function GoalSettingsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const storedGoal = useOnboardingStore((state) => state.goal)
  const setGoal = useOnboardingStore((state) => state.setGoal)

  const { control, handleSubmit } = useForm<CyclistGoalForm>({
    resolver: zodResolver(cyclistGoalSchema),
    defaultValues: storedGoal ?? { type: 'ftp', targetValue: '', eventName: '' },
  })

  const type = useWatch({ control, name: 'type' })
  const targetMeta = getTargetMeta(type)

  const save = handleSubmit(async (values) => {
    setGoal(values)

    // The goal drives both of these. The store write is synchronous and the
    // queries are not, so they are refetched before leaving the screen.
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['goal'] }),
      queryClient.refetchQueries({ queryKey: ['goal-current-value'] }),
    ])

    router.back()
  })

  return (
    <GradntScreen>
      <GradntScrollView>
        <YStack gap="$6">
          <XStack alignItems="center" gap="$3">
            <GradntIconButton accessibilityLabel="Revenir en arrière" onPress={() => router.back()}>
              <ArrowLeft size={18} color="$textPrimary" />
            </GradntIconButton>
            <GradntHeading>Ton objectif</GradntHeading>
          </XStack>

          <YStack gap="$3">
            {goalTypes.map((goalType) => (
              <Controller
                key={goalType.value}
                control={control}
                name="type"
                render={({ field }) => (
                  <GradntChoiceCard
                    title={goalType.title}
                    description={goalType.description}
                    icon={<goalType.icon size={19} color="$accentInk" />}
                    selected={field.value === goalType.value}
                    onPress={() => field.onChange(goalType.value)}
                  />
                )}
              />
            ))}
          </YStack>

          {targetMeta ? (
            <Controller
              control={control}
              name="targetValue"
              render={({ field, fieldState }) => (
                <YStack gap="$2">
                  <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                    {targetMeta.label.toUpperCase()}
                  </GradntText>

                  <XStack alignItems="center" gap="$3">
                    <GradntInput
                      flex={1}
                      value={field.value}
                      onChangeText={field.onChange}
                      keyboardType={targetMeta.keyboardType}
                      placeholder={targetMeta.placeholder}
                    />
                    <GradntText muted>{targetMeta.unit}</GradntText>
                  </XStack>

                  {fieldState.error ? (
                    <GradntText color="$danger" fontSize={12}>
                      {fieldState.error.message}
                    </GradntText>
                  ) : null}
                </YStack>
              )}
            />
          ) : null}

          {type === 'event' ? (
            <Controller
              control={control}
              name="eventName"
              render={({ field, fieldState }) => (
                <YStack gap="$2">
                  <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                    ÉVÉNEMENT
                  </GradntText>

                  <GradntInput
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="Cyclosportive des Monts d’Or"
                  />

                  {fieldState.error ? (
                    <GradntText color="$danger" fontSize={12}>
                      {fieldState.error.message}
                    </GradntText>
                  ) : null}
                </YStack>
              )}
            />
          ) : null}

          <GradntButton onPress={() => void save()}>Enregistrer</GradntButton>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
