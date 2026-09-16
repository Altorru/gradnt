import { colors } from '../tokens'

export const lightTheme = {
  background: colors.bone100,
  backgroundHover: colors.bone200,
  backgroundPress: colors.bone300,
  backgroundFocus: colors.bone200,

  backgroundElevated: colors.bone50,
  backgroundSubtle: colors.bone200,

  color: colors.graphite900,
  colorHover: colors.graphite950,
  colorPress: colors.graphite800,
  colorFocus: colors.graphite950,

  textPrimary: colors.graphite900,
  textSecondary: colors.stone600,
  textDisabled: colors.stone400,

  borderColor: colors.bone300,
  borderColorHover: '#BFC0B7',
  borderColorPress: '#AAACA3',
  borderColorFocus: colors.lime,

  border: colors.bone300,
  borderStrong: '#BFC0B7',

  placeholderColor: colors.stone500,

  /*
   * The same brand green as dark — spent as a fill.
   *
   * #76B900 measures 2.1:1 against Bone, so it cannot be ink here: chart
   * strokes, selected titles and thin borders stay the theme's neutral ink and
   * the green goes where it can carry — buttons, progress, route lines, focus.
   * That is a legibility split, not a second brand colour.
   */
  accent: colors.lime,
  accentInk: colors.graphite900,
  onAccent: colors.graphite950,

  positive: '#4C9930',
  warning: '#D47D18',
  danger: '#D74640',
  recovery: '#4289AD',
} as const
