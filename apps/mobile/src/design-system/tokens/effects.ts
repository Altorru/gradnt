export const effects = {
  shadowSoft: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  shadowCard: {
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  glowLime: {
    // A glow of the brand green, spelled out because a shadow colour is read by
    // the platform and cannot be a Tamagui token. Same value as `colors.lime`.
    shadowColor: '#76B900',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
} as const
