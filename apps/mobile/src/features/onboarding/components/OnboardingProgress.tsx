import { XStack, YStack } from 'tamagui'

type OnboardingProgressProps = {
  step: number
  total: number
}

export function OnboardingProgress({ step, total }: OnboardingProgressProps) {
  return (
    <XStack gap="$2">
      {Array.from({ length: total }).map((_, index) => {
        const active = index < step

        return (
          <YStack
            key={index}
            flex={1}
            height={4}
            borderRadius="$pill"
            backgroundColor={active ? '$accent' : '$backgroundSubtle'}
          />
        )
      })}
    </XStack>
  )
}
