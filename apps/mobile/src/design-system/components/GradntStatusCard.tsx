import type { ReactNode } from 'react'

import { GradntCard, GradntText } from './primitives'

type GradntStatusCardProps = {
  label: string
  value: string
  detail: string
  accent?: boolean
  visual?: ReactNode
}

export function GradntStatusCard({
  label,
  value,
  detail,
  accent = false,
  visual,
}: GradntStatusCardProps) {
  return (
    <GradntCard
      premium
      accent={accent}
      flex={1}
      minHeight={152}
      padding="$4"
      justifyContent="space-between"
    >
      <GradntText muted fontSize={13}>
        {label}
      </GradntText>

      <GradntText weight="bold" fontSize={30} lineHeight={32}>
        {value}
      </GradntText>

      <GradntText color={accent ? '$accent' : '$textSecondary'} weight="semibold" fontSize={13}>
        {detail}
      </GradntText>

      {visual}
    </GradntCard>
  )
}
