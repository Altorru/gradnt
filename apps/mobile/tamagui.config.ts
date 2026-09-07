import { defaultConfig } from '@tamagui/config/v5'
import { createFont, createTamagui, createTokens, isWeb } from 'tamagui'

import { colors, radius, sizes, spacing } from './src/design-system/tokens'
import { darkTheme, lightTheme } from './src/design-system/themes'

const tokens = createTokens({
  color: colors,

  space: {
    ...defaultConfig.tokens.space,
    ...spacing,
  },

  radius: {
    ...defaultConfig.tokens.radius,
    ...radius,
  },

  size: {
    ...defaultConfig.tokens.size,
    ...sizes,
  },

  zIndex: defaultConfig.tokens.zIndex,
})

const geistBody = createFont({
  family: isWeb ? 'Geist, system-ui, sans-serif' : 'Geist_400Regular',

  size: {
    1: 12,
    2: 13,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 32,
    9: 40,
    true: 16,
  },

  lineHeight: {
    1: 16,
    2: 17,
    3: 20,
    4: 23,
    5: 25,
    6: 28,
    7: 30,
    8: 36,
    9: 44,
    true: 23,
  },

  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },

  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: -0.1,
    6: -0.3,
    7: -0.5,
    8: -1,
    9: -1.4,
  },

  face: {
    400: { normal: 'Geist_400Regular' },
    500: { normal: 'Geist_500Medium' },
    600: { normal: 'Geist_600SemiBold' },
    700: { normal: 'Geist_700Bold' },
  },
})

const geistHeading = createFont({
  ...geistBody,
  family: isWeb ? 'Geist, system-ui, sans-serif' : 'Geist_700Bold',
})

const tamaguiConfig = createTamagui({
  ...defaultConfig,

  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
    defaultFont: 'body',
  },

  tokens,

  fonts: {
    body: geistBody,
    heading: geistHeading,
  },

  themes: {
    gradntDark: darkTheme,
    gradntLight: lightTheme,
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
