import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'

import { useAppBackground } from '@/lib/app-background'
import { useAppSettings } from '@/lib/app-settings'
import { alfa, colors } from '@/theme/colors'

function FondoVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true
    p.muted = true
    p.play()
  })
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
}

export function AppBackgroundLayer() {
  const fondo = useAppBackground()
  const { reduceMotion } = useAppSettings()
  if (!fondo) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {fondo.tipo === 'video' && !reduceMotion ? (
        <FondoVideo url={fondo.url} />
      ) : fondo.tipo === 'imagen' ? (
        <Image source={{ uri: fondo.url }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : null}
      <View style={styles.velo} />
    </View>
  )
}

const styles = StyleSheet.create({
  velo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: alfa(colors.background, 0.72) },
})
