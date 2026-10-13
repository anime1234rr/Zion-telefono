import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

function formatoTiempo(segundos: number): string {
  const total = Math.max(0, Math.floor(segundos))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function VoiceMessagePlayer({ url }: { url: string }) {
  const player = useAudioPlayer(url)
  const estado = useAudioPlayerStatus(player)
  const duracion = estado.duration || 0
  const progreso = duracion > 0 ? Math.min(1, estado.currentTime / duracion) : 0

  async function alternar() {
    if (estado.playing) {
      player.pause()
      return
    }
    await setAudioModeAsync({ playsInSilentMode: true }).catch(() => {})
    if (estado.didJustFinish || (duracion > 0 && estado.currentTime >= duracion - 0.1)) {
      await player.seekTo(0)
    }
    player.play()
  }

  return (
    <View style={styles.contenedor}>
      <Pressable style={styles.boton} onPress={alternar} hitSlop={6}>
        <Ionicons name={estado.playing ? 'pause' : 'play'} size={16} color={colors.primaryForeground} />
      </Pressable>
      <View style={styles.pista}>
        <View style={[styles.relleno, { width: `${progreso * 100}%` }]} />
      </View>
      <Text style={styles.tiempo}>
        {formatoTiempo(estado.playing || estado.currentTime > 0 ? estado.currentTime : duracion)}
      </Text>
      <Ionicons name="mic-outline" size={14} color={colors.mutedForeground} />
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.secondary,
    maxWidth: 300,
  },
  boton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pista: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  relleno: { height: '100%', backgroundColor: colors.primary },
  tiempo: { color: colors.mutedForeground, fontSize: fontSize.xs, fontVariant: ['tabular-nums'], minWidth: 34 },
})
