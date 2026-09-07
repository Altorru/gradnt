import { XStack } from 'tamagui'

type GradntProgressBarProps = {
  value: number
}

export function GradntProgressBar({ value }: GradntProgressBarProps) {
  const normalized = Math.min(100, Math.max(0, value))

  return (
    <XStack height={8} borderRadius="$pill" overflow="hidden" backgroundColor="$backgroundSubtle">
      <XStack
        height="100%"
        width={`${normalized}%`}
        borderRadius="$pill"
        backgroundColor="$accent"
      />
    </XStack>
  )
}
