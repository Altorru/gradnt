import type { ComponentProps } from 'react'
import { YStack } from 'tamagui'

export type GradntCardProps = ComponentProps<typeof YStack>

export function GradntCard(props: GradntCardProps) {
  return (
    <YStack
      backgroundColor="$backgroundElevated"
      borderColor="$border"
      borderWidth={1}
      borderRadius="$5"
      padding="$5"
      gap="$3"
      {...props}
    />
  )
}
