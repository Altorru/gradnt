import type { PropsWithChildren } from 'react'

import { YStack } from 'tamagui'

type GradntSectionProps = PropsWithChildren<{
  gap?: '$2' | '$3' | '$4' | '$5' | '$6'
}>

export function GradntSection({ children, gap = '$4' }: GradntSectionProps) {
  return <YStack gap={gap}>{children}</YStack>
}
