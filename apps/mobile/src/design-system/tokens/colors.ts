export const colors = {
  /**
   * GRADNT Green — the one brand colour, and the same in both themes.
   *
   * It replaces a vivid lime plus a second, darker green invented for light
   * mode. That lime was a very high-luminance green: it read as glare on thin
   * strokes over graphite, and went fluorescent on Bone where it measured
   * 1.2:1 — invisible, which is why a second green had to exist.
   *
   * This one is deep enough to hold the Brand on a pale surface as a *fill*,
   * and still reads as energy on graphite, at 7.9:1 against `graphite900`.
   *
   * It is not ink on light. Against `bone100` it measures 2.1:1, so on a pale
   * surface the green fills — buttons, bars, route lines, chips — and the ink
   * stays neutral. That split lives in the themes, not here: there is one
   * green, and the roles decide where it is allowed.
   */
  lime: '#76B900',

  // Neutral dark
  graphite950: '#0C0E0B',
  graphite900: '#11130F',
  graphite850: '#161914',
  graphite800: '#1B1F18',
  graphite700: '#292E25',

  // Neutral light
  bone50: '#FAF8F2',
  bone100: '#F4F1E8',
  bone200: '#E8E5DC',
  bone300: '#D8D5CC',

  // Muted
  stone400: '#A7A99F',
  stone500: '#858980',
  stone600: '#62665D',

  // Semantic
  orange: '#FF6846',
  alpine: '#9DD7FF',
  success: '#92DE65',
  warning: '#FFB951',
  danger: '#FF645E',

  white: '#FFFFFF',
  black: '#000000',
} as const
