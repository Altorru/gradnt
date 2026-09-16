import type { ReactNode } from 'react'
import { YStack } from 'tamagui'

import { GradntButton, GradntCard, GradntHeading, GradntText } from '../primitives'

type GradntStravaConnectBlockProps = {
  onConnect: () => void
  isConnecting?: boolean
  /** Shown under the action. Leave unset while a connection attempt is idle. */
  errorMessage?: string | null
  title?: string
  description?: string
  visual?: ReactNode
}

/**
 * Empty state for the screens whose content comes from Strava.
 *
 * Presentational on purpose: the design system does not reach into a feature's
 * service, so the screen owns the action and this owns how it looks.
 *
 * It is the answer to "there is nothing here *yet*", which is why it never
 * carries a retry button. A failed request is a different state with a
 * different remedy, and dressing one as the other would ask a rider who is
 * already connected to connect again.
 */
export function GradntStravaConnectBlock({
  onConnect,
  isConnecting = false,
  errorMessage = null,
  title = 'Relie tes sorties',
  description = 'GRADNT lit ton historique Strava pour situer ton point de départ et adapter ce qu’il te propose.',
  visual,
}: GradntStravaConnectBlockProps) {
  return (
    <GradntCard accent gap="$4" padding="$5" borderRadius={20}>
      <YStack gap="$2">
        <GradntHeading level={3}>{title}</GradntHeading>
        <GradntText muted fontSize={13} lineHeight={19}>
          {description}
        </GradntText>
      </YStack>

      {visual}

      <GradntButton onPress={onConnect} disabled={isConnecting} opacity={isConnecting ? 0.55 : 1}>
        {isConnecting ? 'Connexion…' : 'Connecter Strava'}
      </GradntButton>

      {errorMessage ? (
        <GradntText color="$danger" fontSize={12} lineHeight={18}>
          {errorMessage}
        </GradntText>
      ) : null}
    </GradntCard>
  )
}
