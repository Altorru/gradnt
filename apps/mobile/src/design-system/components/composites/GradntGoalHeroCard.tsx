import { Image } from 'expo-image'
import { XStack, YStack } from 'tamagui'
import {
  GradntEyebrow,
  GradntBadge,
  GradntCard,
  GradntHeading,
  GradntProgressBar,
  GradntText,
} from '../primitives'

type GradntGoalHeroCardProps = {
  title: string
  current: string
  target: string
  progress: number
  delta: string
  status: string
  illustration?: any
}

export function GradntGoalHeroCard({
  title,
  current,
  target,
  progress,
  delta,
  status,
  illustration,
}: GradntGoalHeroCardProps) {
  return (
    <GradntCard overflow="hidden" padding={0}>
      <YStack position="relative" minHeight={250}>
        {illustration ? (
          <Image
            source={illustration}
            contentFit="cover"
            style={{
              position: 'absolute',
              inset: 0,
            }}
          />
        ) : null}

        <YStack padding="$5" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <GradntEyebrow>{title}</GradntEyebrow>
            <GradntBadge tone="positive">{status}</GradntBadge>
          </XStack>

          <YStack gap="$2">
            <GradntHeading level={2}>FTP</GradntHeading>

            <GradntText fontSize={44} lineHeight={46} weight="bold">
              {current}
              <GradntText muted fontSize={28} lineHeight={30}>
                {' '}
                → {target}
              </GradntText>
            </GradntText>
          </YStack>

          <GradntProgressBar value={progress} />

          <XStack justifyContent="space-between" alignItems="center">
            <GradntText color="$positive" weight="semibold">
              {delta}
            </GradntText>

            <GradntText weight="semibold">{progress}%</GradntText>
          </XStack>
        </YStack>
      </YStack>
    </GradntCard>
  )
}
