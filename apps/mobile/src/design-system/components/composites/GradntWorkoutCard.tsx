import { YStack } from 'tamagui'
import { GradntBadge, GradntButton, GradntCard, GradntHeading, GradntText } from '../primitives'

type GradntWorkoutCardProps = {
  day: string
  title: string
  subtitle: string
  description: string
  cta?: string
}

export function GradntWorkoutCard({
  day,
  title,
  subtitle,
  description,
  cta = 'Voir la séance',
}: GradntWorkoutCardProps) {
  return (
    <GradntCard gap="$4">
      <GradntBadge tone="recovery">{day}</GradntBadge>

      <YStack gap="$1">
        <GradntHeading level={2}>{title}</GradntHeading>
        <GradntText muted>{subtitle}</GradntText>
      </YStack>

      <GradntText>{description}</GradntText>

      <GradntButton>{cta}</GradntButton>
    </GradntCard>
  )
}
