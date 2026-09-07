import type { ImageSource } from 'expo-image'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'

import { colors } from '../../tokens'

type GradntHeroArtworkProps = {
  source: ImageSource
}

export function GradntHeroArtwork({ source }: GradntHeroArtworkProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Artwork principal */}
      <Image
        source={source}
        contentFit="cover"
        contentPosition={{
          left: '76%',
          top: '50%',
        }}
        transition={150}
        style={{
          position: 'absolute',
          top: 116,
          left: -36,
          right: -58,
          bottom: 66,
        }}
      />

      {/* Fade supérieur :
          supprime totalement le bord horizontal de l'image */}
      <LinearGradient
        colors={[
          colors.graphite900,
          'rgba(17,19,15,0.98)',
          'rgba(17,19,15,0.72)',
          'rgba(17,19,15,0.00)',
        ]}
        locations={[0, 0.16, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          top: 100,
          left: 0,
          right: 0,
          height: 84,
        }}
      />

      {/* Fade gauche :
          garde la partie métrique parfaitement lisible */}
      <LinearGradient
        colors={[
          colors.graphite900,
          'rgba(17,19,15,0.94)',
          'rgba(17,19,15,0.58)',
          'rgba(17,19,15,0.10)',
          'rgba(17,19,15,0.00)',
        ]}
        locations={[0, 0.18, 0.44, 0.76, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          position: 'absolute',
          top: 110,
          left: 0,
          width: '48%',
          bottom: 62,
        }}
      />

      {/* Fade inférieur :
          l'artwork disparaît avant la progress bar */}
      <LinearGradient
        colors={[
          'rgba(17,19,15,0.00)',
          'rgba(17,19,15,0.34)',
          'rgba(17,19,15,0.88)',
          colors.graphite900,
        ]}
        locations={[0, 0.34, 0.74, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 54,
          height: 88,
        }}
      />
    </View>
  )
}
