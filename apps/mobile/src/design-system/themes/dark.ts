import { colors } from '../tokens'

export const darkTheme = {
  background: '#0B0E0A',
  backgroundHover: '#141912',
  backgroundPress: '#1A2017',
  backgroundFocus: '#141912',

  backgroundElevated: '#121610',
  backgroundSubtle: '#1A2017',

  color: colors.bone100,
  colorHover: colors.white,
  colorPress: colors.bone200,
  colorFocus: colors.white,

  textPrimary: colors.bone100,
  textSecondary: colors.stone400,
  textDisabled: colors.stone600,

  borderColor: '#293025',
  borderColorHover: '#3A4433',
  borderColorPress: '#46513D',
  borderColorFocus: colors.lime,

  border: '#293025',
  borderStrong: '#3A4433',

  placeholderColor: colors.stone500,

  /*
   * On graphite the brand green is legible as ink — 7.9:1 — so the accent and
   * the accent ink are the same value here. There is no hover tint either: the
   * button answers with opacity and scale, because a second green for hover is
   * a second green.
   */
  accent: colors.lime,
  accentInk: colors.lime,
  onAccent: colors.graphite950,

  positive: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  recovery: colors.alpine,
} as const
