import { XStack, YStack } from 'tamagui'

import type { IntensityShare, IntensityZone } from '@/lib/domain'

import { GradntCard, GradntText } from '../primitives'

type GradntIntensityBreakdownProps = {
  distribution: IntensityShare[]
}

const ZONE_LABELS: Record<IntensityZone, string> = {
  recovery: 'Récupération',
  endurance: 'Endurance',
  tempo: 'Tempo',
  threshold: 'Seuil',
  vo2max: 'VO₂ max',
}

/**
 * Depth carries the intensity, on one hue.
 *
 * An ordered scale reads better as a ramp than as five unrelated colours, and a
 * single accent at rising opacity keeps it legible in both themes — five
 * hand-picked hues would have to be re-tuned for each.
 */
const ZONE_OPACITY: Record<IntensityZone, number> = {
  recovery: 0.22,
  endurance: 0.42,
  tempo: 0.62,
  threshold: 0.82,
  vo2max: 1,
}

/**
 * How the rider's training splits across intensity bands.
 *
 * Replaces a row of four chips that had no `onPress` and one of them marked
 * selected — decoration shaped like a control, which nobody could tap and which
 * claimed a choice that did not exist. It also showed four of the seven real
 * bands as though that were the whole scale.
 */
export function GradntIntensityBreakdown({ distribution }: GradntIntensityBreakdownProps) {
  const totalHours = distribution.reduce((sum, entry) => sum + entry.hours, 0)

  return (
    <GradntCard padding="$4" gap="$3">
      {/* No title of its own: the section it sits in already carries one, and
          two headings over one block is one too many. */}
      <GradntText muted fontSize={12} lineHeight={17}>
        {/* States the base the shares are percentages of. Without it the split
            looks like it covers everything the rider has ever done, when it
            only covers the rides that recorded power. */}
        {Math.round(totalHours * 10) / 10} h avec capteur de puissance
      </GradntText>

      <XStack height={12} borderRadius="$pill" overflow="hidden" gap={2}>
        {distribution.map((entry) => (
          <YStack
            key={entry.zone}
            flex={entry.share}
            backgroundColor="$accentInk"
            opacity={ZONE_OPACITY[entry.zone]}
          />
        ))}
      </XStack>

      <YStack gap="$2">
        {distribution.map((entry) => (
          <XStack key={entry.zone} alignItems="center" gap="$2">
            <YStack
              width={8}
              height={8}
              borderRadius="$pill"
              backgroundColor="$accentInk"
              opacity={ZONE_OPACITY[entry.zone]}
            />

            <GradntText muted flex={1} fontSize={12}>
              {ZONE_LABELS[entry.zone]}
            </GradntText>

            <GradntText weight="semibold" fontSize={12}>
              {Math.round(entry.share * 100)} %
            </GradntText>
          </XStack>
        ))}
      </YStack>
    </GradntCard>
  )
}
