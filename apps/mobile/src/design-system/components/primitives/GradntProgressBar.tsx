import { XStack } from 'tamagui'

type GradntProgressBarProps = {
  value: number
  height?: number
}

export function GradntProgressBar({ value, height = 9 }: GradntProgressBarProps) {
  const normalized = Math.min(100, Math.max(0, value))

  return (
    <XStack
      height={height}
      borderRadius="$pill"
      overflow="hidden"
      backgroundColor="$backgroundSubtle"
    >
      <XStack
        width={`${normalized}%`}
        height="100%"
        backgroundColor="$accent"
        borderRadius="$pill"
      />
    </XStack>
  )
}
