import { Image } from 'expo-image'
import { XStack } from 'tamagui'

import { gradntAssets } from '../../assets'
import { useGradntScheme } from '../../hooks/scheme'
import { GradntText } from '../primitives'

/**
 * The wordmark: the mark standing in for the G, then the letters.
 *
 * The mark is a PNG carrying about 10% transparent padding on every side —
 * measured rather than assumed, 1690×1625 of ink inside a 2048 square. So the
 * box is sized for the *inked* height to land on the cap height of the letters,
 * and that same padding is pulled back out of the margins. Drawn at its box
 * size, the mark reads as a picture parked beside a word instead of the letter
 * it is standing in for.
 *
 * `useGradntScheme` rather than the system scheme: the rider can override the
 * appearance, and the mark has to match the surface actually on screen.
 */
const FONT_SIZE = 18
/** Cap height and inked height, both as a fraction of what they sit in. */
const CAP_HEIGHT = 0.72
const INK_HEIGHT = 0.793
/** Average transparent padding on one side, as a fraction of the image width. */
const SIDE_PADDING = 0.0873

const MARK_SIZE = Math.round((FONT_SIZE * CAP_HEIGHT) / INK_HEIGHT)
const MARK_PADDING = MARK_SIZE * SIDE_PADDING

/**
 * The gap the reader should see, once the transparent padding is cancelled.
 *
 * This is the one number to reach for if the mark sits tight or loose: it is a
 * letter space, not a layout gutter, because the mark is a letter here.
 */
const MARK_GAP = 1

export function GradntWordmark() {
  const scheme = useGradntScheme()
  const mark = scheme === 'light' ? gradntAssets.brand.markLight : gradntAssets.brand.markDark

  return (
    /*
      Labelled as a whole. Read letter by letter the lockup says "RADNT", which
      is not the name, and the mark announces itself as an unlabelled image.
    */
    <XStack alignItems="center" accessible accessibilityRole="image" accessibilityLabel="GRADNT">
      <Image
        source={mark}
        contentFit="contain"
        style={{
          width: MARK_SIZE,
          height: MARK_SIZE,
          marginLeft: -MARK_PADDING,
          marginRight: MARK_GAP - MARK_PADDING,
        }}
      />

      <GradntText weight="bold" fontSize={FONT_SIZE} letterSpacing={0.4}>
        RADNT
      </GradntText>
    </XStack>
  )
}
