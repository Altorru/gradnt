import { ArrowRight, Brain, Route, Target } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { ScrollView } from 'react-native'
import { XStack, YStack } from 'tamagui'

import { GradntButton, GradntHeading, GradntMobileShell, GradntText } from '@/design-system'
import { colors } from '@/design-system/tokens'

import { OnboardingProgress } from '../components/OnboardingProgress'

const benefits = [
  {
    icon: Target,
    title: 'Un objectif clair',
    description: 'GRADNT suit ta progression et te montre où tu en es réellement.',
  },
  {
    icon: Brain,
    title: 'Un plan qui s’adapte',
    description: 'Tes séances évoluent avec tes sorties, ta disponibilité et ta forme.',
  },
  {
    icon: Route,
    title: 'Toujours la prochaine étape',
    description: 'Une recommandation concrète plutôt qu’un tableau rempli de chiffres.',
  },
]

export function WelcomeScreen() {
  const router = useRouter()

  return (
    <GradntMobileShell>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 22,
          paddingTop: 22,
          paddingBottom: 28,
        }}
      >
        <YStack flex={1} justifyContent="space-between" gap="$8">
          <YStack gap="$7">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap="$2">
                <GradntText color="$accent" weight="bold" fontSize={18}>
                  ▲
                </GradntText>

                <GradntText weight="bold" fontSize={18} letterSpacing={0.5}>
                  GRADNT
                </GradntText>
              </XStack>

              <GradntText muted fontSize={12} weight="medium">
                1 / 6
              </GradntText>
            </XStack>

            <OnboardingProgress step={1} total={6} />

            <YStack gap="$3" paddingTop="$4">
              <GradntHeading fontSize={40} lineHeight={43} letterSpacing={-1.6}>
                Ride what&apos;s next.
              </GradntHeading>

              <GradntText muted fontSize={17} lineHeight={25}>
                Transforme tes sorties vélo en une progression claire, personnelle et réellement
                actionnable.
              </GradntText>
            </YStack>

            <YStack gap="$5" paddingTop="$3">
              {benefits.map((benefit) => {
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
                      <Icon size={19} color={colors.lime} />
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
                router.push('/onboarding/profile')
              }}
            >
              Commencer
            </GradntButton>

            <GradntText muted textAlign="center" fontSize={12} lineHeight={17}>
              Environ 3 minutes · tu pourras tout modifier ensuite
            </GradntText>
          </YStack>
        </YStack>
      </ScrollView>
    </GradntMobileShell>
  )
}
