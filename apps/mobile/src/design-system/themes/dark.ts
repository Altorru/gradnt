import { colors } from '../tokens'

export const darkTheme = {
  background: colors.graphite900,
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
