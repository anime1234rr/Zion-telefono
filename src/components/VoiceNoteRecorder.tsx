import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio'

import { showAppAlert } from '@/hooks/use-app-alert'
import { getErrorMessage } from '@/lib/utils'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const MAX_MS = 5 * 60 * 1000

function formatoTiempo(ms: number): string {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export function VoiceNoteRecorder({
  onSend,
  onRecordingChange,
}: {
  onSend: (uri: string) => Promise<void>
  onRecordingChange?: (grabando: boolean) => void
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY)
  const estado = useAudioRecorderState(recorder, 250)
  const [activo, setActivo] = useState(false)
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    onRecordingChange?.(activo)
  }, [activo, onRecordingChange])

  useEffect(() => {
    if (activo && estado.durationMillis >= MAX_MS) void terminar(true)
  })

  async function empezar() {
    try {
      const permiso = await requestRecordingPermissionsAsync()
      if (!permiso.granted) {
        showAppAlert('Micrófono bloqueado', 'Permití el acceso al micrófono en los ajustes del sistema para grabar notas de voz.')
        return
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })
      await recorder.prepareToRecordAsync()
      recorder.record()
      setActivo(true)
    } catch (err) {
      showAppAlert('No se pudo grabar', getErrorMessage(err))
    }
  }

  async function terminar(enviar: boolean) {
    if (!activo) return
    setActivo(false)
    try {
      await recorder.stop()
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true })
      const uri = recorder.uri
      if (!enviar || !uri) return
      if (estado.durationMillis < 700) return
      setEnviando(true)
      await onSend(uri)
    } catch (err) {
      showAppAlert('No se pudo enviar la nota de voz', getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  if (enviando) {
    return (
      <View style={styles.boton}>
        <ActivityIndicator size="small" color={colors.primaryForeground} />
      </View>
    )
  }

  if (!activo) {
    return (
      <Pressable style={styles.boton} onPress={empezar} hitSlop={6} accessibilityLabel="Grabar nota de voz">
        <Ionicons name="mic" size={18} color={colors.primaryForeground} />
      </Pressable>
    )
  }

  return (
    <View style={styles.barra}>
      <Pressable onPress={() => terminar(false)} hitSlop={8} accessibilityLabel="Descartar">
        <Ionicons name="trash-outline" size={20} color={colors.destructive} />
      </Pressable>
      <View style={styles.punto} />
      <Text style={styles.tiempo}>{formatoTiempo(estado.durationMillis)}</Text>
      <Text style={styles.ayuda} numberOfLines={1}>
        Grabando…
      </Text>
      <Pressable style={styles.boton} onPress={() => terminar(true)} accessibilityLabel="Enviar nota de voz">
        <Ionicons name="send" size={16} color={colors.primaryForeground} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  boton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barra: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.input,
    borderRadius: radius.lg,
    paddingLeft: spacing.md,
    paddingVertical: 4,
    paddingRight: 4,
  },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.destructive },
  tiempo: { color: colors.foreground, fontSize: fontSize.md, fontVariant: ['tabular-nums'] },
  ayuda: { flex: 1, color: colors.mutedForeground, fontSize: fontSize.sm },
})
