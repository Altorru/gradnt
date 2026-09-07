import { colors } from '../tokens'

export const lightTheme = {
  // Tamagui conventional roles
  background: colors.bone100,
  backgroundHover: colors.bone200,
  backgroundPress: colors.bone300,
  backgroundFocus: colors.bone200,

  color: colors.graphite900,
  colorHover: colors.graphite950,
  colorPress: colors.graphite800,
  colorFocus: colors.graphite950,

  borderColor: colors.bone300,
  borderColorHover: '#BFC0B7',
  borderColorPress: '#AAACA3',
  borderColorFocus: colors.limeStrong,

  placeholderColor: colors.stone500,

  // GRADNT semantic roles
  backgroundElevated: colors.bone50,
  backgroundSubtle: colors.bone200,

  textPrimary: colors.graphite900,
  textSecondary: colors.stone600,
  textDisabled: colors.stone400,

  border: colors.bone300,
  borderStrong: '#BFC0B7',

  accent: colors.limeStrong,
  accentHover: '#A6E20C',
  onAccent: colors.graphite900,

  positive: '#4C9930',
  warning: '#D47D18',
  danger: '#D74640',
  recovery: '#4289AD',
} as const
