import { ChevronRight } from '@tamagui/lucide-icons-2'
import { XStack } from 'tamagui'
import { GradntHeading, GradntText } from './primitives'

type GradntSectionHeaderProps = {
  title: string
  action?: string
}

export function GradntSectionHeader({ title, action }: GradntSectionHeaderProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between">
      <GradntHeading level={3}>{title}</GradntHeading>

      {action ? (
        <XStack alignItems="center" gap="$1">
          <GradntText muted fontSize={13}>
            {action}
          </GradntText>

          <ChevronRight size={15} color="$textSecondary" />
        </XStack>
      ) : null}
    </XStack>
  )
}
