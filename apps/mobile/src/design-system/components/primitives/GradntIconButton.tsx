import type { ComponentProps, ReactNode } from 'react'
import { Button } from 'tamagui'

type GradntIconButtonProps = Omit<ComponentProps<typeof Button>, 'children'> & {
  children: ReactNode
}

export function GradntIconButton({ children, ...props }: GradntIconButtonProps) {
  return (
    <Button
      width={42}
      height={42}
      minWidth={42}
      padding={0}
      borderRadius="$pill"
      borderWidth={1}
      borderColor="$border"
      backgroundColor="$backgroundElevated"
      pressStyle={{
        scale: 0.94,
        opacity: 0.88,
      }}
      {...props}
    >
      {children}
    </Button>
  )
}
