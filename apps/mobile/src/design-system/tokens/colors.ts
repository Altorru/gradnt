export const colors = {
  // Brand
  lime: '#C8FF3D',
  limeStrong: '#B7F51F',
  limeMuted: '#DDFE82',
  /**
   * Deeper limes for the dark theme.
   *
   * `lime` is a very high-luminance green: ~16:1 against the dark background.
   * That reads as glare rather than emphasis on thin strokes and small text.
   */
  limeDeep: '#A4E600',
  /** Accent as *ink* on the dark background: text, thin strokes. Calmer still. */
  limeInkDark: '#79B81C',
  /** Accent as *ink* on a light background, where a bright lime vanishes. */
  limeInkLight: '#3F6B00',

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
