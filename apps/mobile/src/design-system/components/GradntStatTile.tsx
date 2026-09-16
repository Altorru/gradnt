import { ArrowDown, ArrowUp } from '@tamagui/lucide-icons-2'
import { XStack } from 'tamagui'

import { GradntCard, GradntText } from './primitives'

type GradntStatTileProps = {
  label: string
  value: string
  unit?: string
  /**
   * Change against the previous window. Omitted or null when there is nothing
   * to compare — a rider's first week has no previous one.
   */
  delta?: number | null
  /**
   * Which way is an improvement. Volume and distance are better rising; a
   * figure like resting heart rate would not be. It only decides the colour,
   * never whether the change is shown.
   */
  risingIsGood?: boolean
}

/**
 * One figure, with how it moved.
 *
 * A number on its own says where the rider is; the change says whether they are
 * getting anywhere, which is the question the home screen exists to answer. The
 * previous tiles showed the app's own state instead — "Strava", "Importé" — so
 * they reported on the plumbing rather than on the riding.
 */
export function GradntStatTile({
  label,
  value,
  unit,
  delta = null,
  risingIsGood = true,
}: GradntStatTileProps) {
  const hasDelta = delta !== null && delta !== 0
  const rising = (delta ?? 0) > 0
  const improving = hasDelta && rising === risingIsGood

  return (
    <GradntCard premium flex={1} padding="$4" borderRadius={18} gap="$2">
      <GradntText muted fontSize={11} weight="semibold" letterSpacing={1} numberOfLines={1}>
        {label.toUpperCase()}
      </GradntText>

      <XStack alignItems="baseline" gap="$1">
        <GradntText weight="bold" fontSize={26} lineHeight={30} letterSpacing={-0.8}>
          {value}
        </GradntText>

        {unit ? (
          <GradntText muted fontSize={13} weight="semibold">
            {unit}
          </GradntText>
        ) : null}
      </XStack>

      {/* Held open even with nothing to say, so tiles side by side stay level. */}
      <XStack alignItems="center" gap="$1">
        {hasDelta ? (
          <>
            {rising ? (
              <ArrowUp size={13} color={improving ? '$positive' : '$textSecondary'} />
            ) : (
              <ArrowDown size={13} color={improving ? '$positive' : '$textSecondary'} />
            )}

            <GradntText
              color={improving ? '$positive' : '$textSecondary'}
              weight="semibold"
              fontSize={12}
            >
              {rising ? '+' : '−'}
              {Math.abs(delta ?? 0)}
              {unit ? ` ${unit}` : ''}
            </GradntText>
          </>
        ) : (
          <GradntText muted fontSize={12}>
            —
          </GradntText>
        )}
      </XStack>
    </GradntCard>
  )
}
