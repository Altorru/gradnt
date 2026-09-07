import { defaultConfig } from '@tamagui/config/v5'
import { createTamagui, createTokens } from 'tamagui'

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

const config = createTamagui({
  ...defaultConfig,

  tokens,

  themes: {
    ...defaultConfig.themes,

    gradntDark: darkTheme,
    gradntLight: lightTheme,
  },
})

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {
    readonly __gradntConfigBrand?: unique symbol
  }
}

export default config
