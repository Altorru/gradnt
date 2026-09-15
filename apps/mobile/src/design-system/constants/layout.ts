/**
 * Horizontal gutter for screen content.
 *
 * A plain number rather than a Tamagui token on purpose: it is consumed both as
 * a Tamagui prop and inside React Native style objects (such as a ScrollView
 * `contentContainerStyle`), where tokens do not resolve.
 */
export const SCREEN_GUTTER = 20

/**
 * Maximum width of the content column.
 *
 * Always paired with `width: '100%'`, so it only engages on screens wider than
 * this value: every phone stays full-bleed and only genuinely wide screens are
 * centred. This used to be 430, which is below the width of many phones, so it
 * capped ordinary devices and left unpainted side gutters.
 *
 * Must stay above the widest phone (~430dp) and the Pixel Fold unfolded (~673dp).
 */
export const CONTENT_MAX_WIDTH = 700
