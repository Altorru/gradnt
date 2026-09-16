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
  GradntChip,
  GradntHeading,
  GradntIconButton,
  GradntInput,
  GradntScreen,
  GradntScrollView,
  GradntText,
} from '@/design-system'
import { useTranslation } from '@/i18n'
import { getTargetMeta, goalMeasures, goalTypes } from '@/features/onboarding/domain/goal.options'
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
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const storedGoal = useOnboardingStore((state) => state.goal)
  const setGoal = useOnboardingStore((state) => state.setGoal)

  const { control, handleSubmit } = useForm<CyclistGoalForm>({
    resolver: zodResolver(cyclistGoalSchema),
    defaultValues: storedGoal ?? { type: 'ftp', targetValue: '', eventName: '' },
  })

  const type = useWatch({ control, name: 'type' })
  const targetMeta = getTargetMeta(type, t)

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
            <GradntIconButton accessibilityLabel={t('common.back')} onPress={() => router.back()}>
              <ArrowLeft size={18} color="$textPrimary" />
            </GradntIconButton>
            <GradntHeading>{t('settings.goalTitle')}</GradntHeading>
          </XStack>

          <YStack gap="$3">
            {goalTypes(t).map((goalType) => (
              <Controller
                key={goalType.value}
                control={control}
                name="type"
                render={({ field }) => (
                  <GradntChoiceCard
                    title={goalType.title}
                    description={goalType.description}
                    icon={goalType.icon}
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
                    placeholder={t('settings.eventPlaceholder')}
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

          {type === 'event' ? (
            <Controller
              control={control}
              name="targetDate"
              render={({ field, fieldState }) => (
                <YStack gap="$2">
                  <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                    DATE
                  </GradntText>

                  <GradntText muted fontSize={12} lineHeight={18}>
                    Au format AAAA-MM-JJ. L’app en tire le compte à rebours.
                  </GradntText>

                  <GradntInput
                    value={field.value ?? ''}
                    onChangeText={field.onChange}
                    placeholder={t('settings.datePlaceholder')}
                    autoCapitalize="none"
                    autoCorrect={false}
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

          {/* Only these two carry a total to reach; an FTP is a value and an
              event is a date. */}
          {type === 'distance' || type === 'climbing' ? (
            <Controller
              control={control}
              name="measure"
              render={({ field }) => (
                <YStack gap="$3">
                  <GradntText muted fontSize={12} weight="semibold" letterSpacing={1}>
                    COMMENT LE MESURER
                  </GradntText>

                  <XStack gap="$2" flexWrap="wrap">
                    {goalMeasures(t).map((measure) => (
                      <GradntChip
                        key={measure.value}
                        label={measure.label}
                        selected={(field.value ?? 'cumulative') === measure.value}
                        onPress={() => field.onChange(measure.value)}
                      />
                    ))}
                  </XStack>

                  <GradntText muted fontSize={12} lineHeight={18}>
                    {
                      goalMeasures(t).find(
                        (measure) => measure.value === (field.value ?? 'cumulative'),
                      )?.description
                    }
                  </GradntText>
                </YStack>
              )}
            />
          ) : null}

          <GradntButton onPress={() => void save()}>{t('settings.save')}</GradntButton>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
