import type { ImageSource } from 'expo-image'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, useColorScheme, View } from 'react-native'

import { useThemeColor } from '../../hooks/useThemeColor'
import { withAlpha } from '../../tokens'

type GradntHeroArtworkProps = {
  source: ImageSource
}

/**
 * Illustration plein cadre avec fondus sur les bords.
 *
 * Les fondus ciblent le fond de la carte elle-même, et non une couleur propre :
 * ils étaient réglés sur du graphite, qui approximait le fond sombre et était
 * franchement faux sur le fond clair — l'artwork y terminait sur une tache
 * sombre au lieu de se fondre dans la carte.
 */
export function GradntHeroArtwork({ source }: GradntHeroArtworkProps) {
  const themeColor = useThemeColor()
  const scheme = useColorScheme()
  const backdrop = themeColor('backgroundElevated')

  /**
   * Les fondus sont volontairement plus faibles en clair.
   *
   * Un voile pâle lit comme du brouillard là où un voile sombre lit comme une
   * ombre : à alphas égaux, le fond clair délave l'illustration bien davantage.
   *
   * Les bords extrêmes restent opaques — ils masquent le bord franc de l'image,
   * et les atténuer ferait réapparaître la cassure qu'ils corrigent.
   */
  const veil = scheme === 'light' ? 0.6 : 1
  const fade = (alpha: number) => withAlpha(backdrop, alpha * veil)

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Artwork principal */}
      <Image
        source={source}
        contentFit="cover"
        contentPosition={{
          left: '70%',
          top: '50%',
        }}
        transition={150}
        style={{
          position: 'absolute',
          top: 110,
          left: 0,
          right: 0,
          bottom: 50,
        }}
      />

      {/* Fondu supérieur :
          supprime le bord horizontal de l'image */}
      <LinearGradient
        colors={[backdrop, fade(0.88), fade(0.48), fade(0)]}
        locations={[0, 0.24, 0.66, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          height: 104,
        }}
      />

      {/* Fondu gauche :
          garde la partie métrique lisible, en s'éteignant progressivement */}
      <LinearGradient
        colors={[backdrop, fade(0.9), fade(0.56), fade(0.18), fade(0)]}
        locations={[0, 0.2, 0.48, 0.78, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: 'absolute',
          top: 110,
          left: 0,
          width: '54%',
          bottom: 62,
        }}
      />

      {/* Fondu inférieur :
          l'artwork disparaît avant la progress bar */}
      <LinearGradient
        colors={[fade(0), fade(0.26), fade(0.74), backdrop]}
        locations={[0, 0.28, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 54,
          height: 104,
        }}
      />
    </View>
  )
}
