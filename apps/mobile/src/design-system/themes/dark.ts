import { colors } from '../tokens'

export const darkTheme = {
  // Tamagui conventional roles
  background: colors.graphite900,
  backgroundHover: colors.graphite850,
  backgroundPress: colors.graphite800,
  backgroundFocus: colors.graphite850,

  color: colors.bone100,
  colorHover: colors.bone50,
  colorPress: colors.bone200,
  colorFocus: colors.bone50,

  borderColor: colors.graphite700,
  borderColorHover: '#3B4135',
  borderColorPress: '#454C3E',
  borderColorFocus: colors.lime,

  placeholderColor: colors.stone500,

  // GRADNT semantic roles
  backgroundElevated: colors.graphite800,
  backgroundSubtle: colors.graphite850,

  textPrimary: colors.bone100,
  textSecondary: colors.stone400,
  textDisabled: colors.stone600,

  border: colors.graphite700,
  borderStrong: '#3B4135',

  accent: colors.lime,
  accentHover: colors.limeStrong,
  onAccent: colors.graphite900,

  positive: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  recovery: colors.alpine,
} as const
