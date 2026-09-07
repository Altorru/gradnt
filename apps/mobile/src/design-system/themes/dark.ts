import { colors } from '../tokens'

export const darkTheme = {
  background: colors.graphite950,
  backgroundHover: colors.graphite900,
  backgroundPress: colors.graphite850,
  backgroundFocus: colors.graphite900,

  backgroundElevated: colors.graphite900,
  backgroundSubtle: colors.graphite850,

  color: colors.bone100,
  colorHover: colors.white,
  colorPress: colors.bone200,
  colorFocus: colors.white,

  textPrimary: colors.bone100,
  textSecondary: colors.stone400,
  textDisabled: colors.stone600,

  borderColor: colors.graphite700,
  borderColorHover: '#3B4135',
  borderColorPress: '#454C3E',
  borderColorFocus: colors.lime,

  border: colors.graphite700,
  borderStrong: '#3B4135',

  placeholderColor: colors.stone500,

  accent: colors.lime,
  accentHover: colors.limeStrong,
  onAccent: colors.graphite950,

  positive: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  recovery: colors.alpine,
} as const
