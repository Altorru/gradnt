import { useEffect, useState } from 'react'
import { type LayoutChangeEvent, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { scheduleOnRN } from 'react-native-worklets'
import { XStack, YStack } from 'tamagui'

import { useThemeColor } from '../../hooks/useThemeColor'
import { GradntText } from './GradntText'

type GradntRangeSliderProps = {
  /** The chosen span, within the bounds below. */
  value: { min: number; max: number }
  /** The bounds the span is chosen inside. */
  bounds: { min: number; max: number }
  step: number
  onValueChange: (value: { min: number; max: number }) => void
  /**
   * The sentence above the track, composed by the caller.
   *
   * A string and not a label plus a range: "entre 20 et 60 km" puts the unit
   * inside the phrase, and word order is the language's business.
   */
  caption?: string
  /** The unit the bounds are read in, as a symbol — `km`, `m`. */
  unit?: string
  accessibilityLabel?: string
}

const TRACK_HEIGHT = 6
const THUMB_SIZE = 24

/**
 * A span, chosen with two thumbs.
 *
 * A rider does not want a 60 km ride, they want a ride *of about* that length —
 * and a single thumb cannot say so. Scoring by distance from one figure punished
 * every route for missing a target nobody had chosen; a span says what is
 * actually meant, and everything inside it is equally right.
 *
 * The drag runs on the UI thread through shared values, and React is told only
 * when the snapped pair changes — not once per frame. A slider reports tens of
 * times a second while a finger moves, and re-rendering the screen that often to
 * redraw the same step is how a control starts to stutter on a mid-range
 * Android.
 *
 * One gesture covers the whole track and moves whichever thumb is nearest, which
 * is what stops two overlapping handlers fighting for the same touch. The thumbs
 * cannot cross: each is clamped against the other.
 */
export function GradntRangeSlider({
  value,
  bounds,
  step,
  onValueChange,
  caption,
  unit,
  accessibilityLabel,
}: GradntRangeSliderProps) {
  // A plain View and an Animated.View cannot resolve Tamagui tokens, so the
  // roles are read once here rather than written out as palette values.
  const trackColor = useThemeColor()('border')
  const accentColor = useThemeColor()('accentInk')

  const [trackWidth, setTrackWidth] = useState(0)

  const lowValue = useSharedValue(value.min)
  const highValue = useSharedValue(value.max)
  const activeThumb = useSharedValue<'low' | 'high'>('low')
  // The pair last handed to React, so a drag reports per step and not per pixel.
  const lastReported = useSharedValue(0)

  const span = bounds.max - bounds.min || 1

  /**
   * Value to pixels, in the chart's own coordinate space.
   *
   * `'worklet'` is not decoration: this is called from `useAnimatedStyle` and
   * from the gesture handlers, which both run on the UI thread. Without the
   * directive the UI runtime tries to call back into the React Native runtime
   * synchronously and throws "Tried to synchronously call a Remote Function" —
   * a crash that only appears on device, never in tests.
   */
  const xOf = (value: number) => {
    'worklet'
    return ((value - bounds.min) / span) * trackWidth
  }

  useEffect(() => {
    if (trackWidth === 0) {
      return
    }

    lowValue.set(value.min)
    highValue.set(value.max)
    lastReported.set(value.min * 100_000 + value.max)
  }, [value, trackWidth, lowValue, highValue, lastReported])

  const lowThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: xOf(lowValue.get()) - THUMB_SIZE / 2 }],
  }))

  const highThumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: xOf(highValue.get()) - THUMB_SIZE / 2 }],
  }))

  const spanStyle = useAnimatedStyle(() => ({
    left: xOf(lowValue.get()),
    width: Math.max(xOf(highValue.get()) - xOf(lowValue.get()), 0),
  }))

  // Fires when the pair settles on a new pair of steps, and not before.
  useAnimatedReaction(
    () => lowValue.get() * 100_000 + highValue.get(),
    (key) => {
      if (key !== lastReported.get()) {
        lastReported.set(key)
        scheduleOnRN(onValueChange, { min: lowValue.get(), max: highValue.get() })
      }
    },
  )

  const pan = Gesture.Pan()
    .onBegin((event) => {
      'worklet'
      if (trackWidth === 0) {
        return
      }

      const x = Math.min(Math.max(event.x, 0), trackWidth)
      // Whichever thumb is nearer takes the gesture.
      activeThumb.set(
        Math.abs(x - xOf(lowValue.get())) <= Math.abs(x - xOf(highValue.get())) ? 'low' : 'high',
      )
    })
    .onUpdate((event) => {
      'worklet'
      if (trackWidth === 0) {
        return
      }

      const x = Math.min(Math.max(event.x, 0), trackWidth)
      const snapped = Math.round((bounds.min + (x / trackWidth) * span) / step) * step

      if (activeThumb.get() === 'low') {
        // Never past the other thumb: a crossed pair has no meaning, and the
        // rider can always drag the other one instead.
        lowValue.set(Math.min(snapped, highValue.get()))
      } else {
        highValue.set(Math.max(snapped, lowValue.get()))
      }
    })

  return (
    <YStack gap="$2">
      {caption ? (
        <GradntText muted fontSize={12} weight="semibold">
          {caption}
        </GradntText>
      ) : null}

      <GestureDetector gesture={pan}>
        <View
          accessibilityRole="adjustable"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ min: value.min, max: value.max, now: value.max }}
          onLayout={(event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width)}
          // Taller than the track so the whole control is a comfortable target.
          style={{ height: THUMB_SIZE, justifyContent: 'center' }}
        >
          <View
            style={{
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
              backgroundColor: trackColor,
            }}
          />

          {/* Absolutely positioned and childless, so animating its geometry
              costs no layout pass. */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                height: TRACK_HEIGHT,
                borderRadius: TRACK_HEIGHT / 2,
                backgroundColor: accentColor,
              },
              spanStyle,
            ]}
          />

          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: accentColor,
              },
              lowThumbStyle,
            ]}
          />

          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 0,
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: THUMB_SIZE / 2,
                backgroundColor: accentColor,
              },
              highThumbStyle,
            ]}
          />
        </View>
      </GestureDetector>

      <XStack justifyContent="space-between">
        <GradntText muted fontSize={11}>
          {unit ? `${bounds.min} ${unit}` : bounds.min}
        </GradntText>

        <GradntText muted fontSize={11}>
          {unit ? `${bounds.max} ${unit}` : bounds.max}
        </GradntText>
      </XStack>
    </YStack>
  )
}
