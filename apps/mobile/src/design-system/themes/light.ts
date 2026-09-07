import { colors } from '../tokens'

export const lightTheme = {
  background: colors.bone100,
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
