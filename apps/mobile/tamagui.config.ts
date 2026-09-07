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

const tamaguiConfig = createTamagui({
  ...defaultConfig,

  settings: {
    ...defaultConfig.settings,
    onlyAllowShorthands: false,
  },

  tokens,

  // Important:
  // GRADNT owns its complete theme contract.
  // Do NOT merge defaultConfig.themes here.
  themes: {
    gradntDark: darkTheme,
    gradntLight: lightTheme,
  },
})

export type AppConfig = typeof tamaguiConfig

declare module 'tamagui' {
  // Required by Tamagui for strongly typed custom tokens/themes.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig
