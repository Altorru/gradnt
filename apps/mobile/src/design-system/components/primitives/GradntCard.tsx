import type { ComponentProps } from 'react'
import { YStack } from 'tamagui'

export type GradntCardProps = ComponentProps<typeof YStack> & {
  premium?: boolean
  accent?: boolean
}

export function GradntCard({
  premium = false,
  accent = false,
  children,
  ...props
}: GradntCardProps) {
  const backgroundImage = accent
    ? 'linear-gradient(145deg, rgba(200,255,61,0.055) 0%, rgba(255,255,255,0.018) 32%, rgba(255,255,255,0) 62%)'
    : premium
      ? 'linear-gradient(145deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 34%, rgba(255,255,255,0) 65%)'
      : undefined

  return (
    <YStack
      position="relative"
      overflow="hidden"
      backgroundColor="$backgroundElevated"
      backgroundImage={backgroundImage}
      borderColor="$border"
      borderWidth={1}
      borderRadius="$5"
      padding="$5"
      gap="$3"
      boxShadow={
        premium || accent
          ? '0 8px 28px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.025)'
          : '0 4px 16px rgba(0,0,0,0.10)'
      }
      {...props}
    >
      {children}
    </YStack>
  )
}
