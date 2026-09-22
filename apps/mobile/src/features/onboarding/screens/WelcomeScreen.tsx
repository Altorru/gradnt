import { ArrowRight, Brain, Route, Target } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { XStack, YStack } from 'tamagui'

import {
  GradntButton,
  GradntHeading,
  GradntScreen,
  GradntScrollView,
  GradntText,
  GradntWordmark,
} from '@/design-system'
import { colors } from '@/design-system/tokens'

import { useTranslation, type Translate } from '@/i18n'

import { OnboardingProgress } from '../components/OnboardingProgress'
import { getOnboardingResumeRoute, useOnboardingStore } from '../store/onboarding.store'

function benefits(t: Translate) {
  return [
    {
      icon: Target,
      title: t('onboarding.welcome.benefits.goal.title'),
      description: t('onboarding.welcome.benefits.goal.description'),
    },
    {
      icon: Brain,
      title: t('onboarding.welcome.benefits.plan.title'),
      description: t('onboarding.welcome.benefits.plan.description'),
    },
    {
      icon: Route,
      title: t('onboarding.welcome.benefits.next.title'),
      description: t('onboarding.welcome.benefits.next.description'),
    },
  ]
}

export function WelcomeScreen() {
  const router = useRouter()
  const { t } = useTranslation()
  const currentStep = useOnboardingStore((state) => state.currentStep)

  /**
   * Resuming is a choice made here, not a redirect imposed on the way through.
   *
   * This screen stays mounted under every step of the flow, so an effect that
   * navigated whenever `currentStep` moved fired on each save — and pushed a
   * step of its own over the one the rider had just reached. The launch
   * decision belongs to `AppEntryScreen`, which is gone by then.
   */
  const resumeRoute =
    currentStep > 1 ? getOnboardingResumeRoute(currentStep) : '/onboarding/profile'

  return (
    <GradntScreen>
      <GradntScrollView contentStyle={{ flexGrow: 1 }}>
        <YStack flex={1} justifyContent="space-between" gap="$8">
          <YStack gap="$7">
            <XStack justifyContent="space-between" alignItems="center">
              <GradntWordmark />

              <GradntText muted fontSize={12} weight="medium">
                1 / 5
              </GradntText>
            </XStack>

            <OnboardingProgress step={1} total={5} />

            <YStack gap="$3" paddingTop="$4">
              <GradntHeading fontSize={40} lineHeight={43} letterSpacing={-1.6}>
                {t('onboarding.welcome.headline')}
              </GradntHeading>

              <GradntText muted fontSize={17} lineHeight={25}>
                {t('onboarding.welcome.subtitle')}
              </GradntText>
            </YStack>

            <YStack gap="$5" paddingTop="$3">
              {benefits(t).map((benefit) => {
                const Icon = benefit.icon

                return (
                  <XStack key={benefit.title} gap="$4" alignItems="flex-start">
                    <YStack
                      width={42}
                      height={42}
                      borderRadius={14}
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="$backgroundElevated"
                      borderWidth={1}
                      borderColor="$border"
                    >
                      <Icon size={19} color="$accentInk" />
                    </YStack>

                    <YStack flex={1} gap="$1">
                      <GradntText weight="semibold" fontSize={15}>
                        {benefit.title}
                      </GradntText>

                      <GradntText muted fontSize={13} lineHeight={19}>
                        {benefit.description}
                      </GradntText>
                    </YStack>
                  </XStack>
                )
              })}
            </YStack>
          </YStack>

          <YStack gap="$3">
            <GradntButton
              iconAfter={<ArrowRight size={18} color={colors.graphite950} />}
              onPress={() => {
                router.push(resumeRoute)
              }}
            >
              {currentStep > 1 ? t('onboarding.welcome.resume') : t('onboarding.welcome.start')}
            </GradntButton>

            <GradntText muted textAlign="center" fontSize={12} lineHeight={17}>
              {t('onboarding.welcome.footnote')}
            </GradntText>
          </YStack>
        </YStack>
      </GradntScrollView>
    </GradntScreen>
  )
}
