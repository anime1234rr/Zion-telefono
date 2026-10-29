import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import {
  listarMensajesGuardados,
  quitarMensajeGuardado,
  useCantidadMensajesGuardados,
  type SavedMessageRow,
} from '@/lib/saved-messages'
import {
  PRESETS_RECORDATORIO,
  calcularFechaPreset,
  cancelarRecordatorioMensaje,
  crearRecordatorioMensaje,
  listarRecordatoriosPendientes,
  type RecordatorioMensaje,
} from '@/lib/reminders'
import { showAppAlert } from '@/hooks/use-app-alert'
import { getErrorMessage } from '@/lib/utils'
import { relativeTime } from '@/lib/internal/core-utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/theme'
import { staffStyles } from '@/screens/staff/staff-ui'

function formatFechaRecordatorio(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SavedMessagesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [filas, setFilas] = useState<SavedMessageRow[]>([])
  const [recordatorios, setRecordatorios] = useState<Map<string, RecordatorioMensaje>>(new Map())
  const cantidad = useCantidadMensajesGuardados()

  useEffect(() => {
    listarMensajesGuardados().then(setFilas)
  }, [cantidad])

  const cargarRecordatorios = useCallback(() => {
    listarRecordatoriosPendientes()
      .then((lista) => {
        const mapa = new Map<string, RecordatorioMensaje>()
        for (const r of lista) mapa.set(r.mensajeId, r)
        setRecordatorios(mapa)
      })
      .catch(() => {})
  }, [])

  useFocusEffect(
    useCallback(() => {
      cargarRecordatorios()
    }, [cargarRecordatorios])
  )

  function abrir(fila: SavedMessageRow) {
    if (fila.scope === 'canal' && fila.serverId && fila.channelId) {
      navigation.navigate('Channel', {
        serverId: fila.serverId,
        channelId: fila.channelId,
        channelName: fila.channelName ?? 'canal',
        highlightMessageId: fila.id,
      })
    } else if (fila.conversationId) {
      navigation.navigate('DMChat', { conversationId: fila.conversationId })
    }
  }

  async function programarRecordatorio(fila: SavedMessageRow, recordarEn: Date) {
    try {
      const origen =
        fila.scope === 'canal'
          ? `#${fila.channelName ?? 'canal'}${fila.serverName ? ` · ${fila.serverName}` : ''}`
          : 'un mensaje directo'
      await crearRecordatorioMensaje({
        mensajeId: fila.id,
        titulo: 'Recordatorio',
        cuerpo: `${fila.authorName} en ${origen}: ${fila.preview}`,
        enlace: fila.link,
        recordarEn,
      })
      cargarRecordatorios()
    } catch (err) {
      showAppAlert('No se pudo programar el recordatorio', getErrorMessage(err))
    }
  }

  async function handleCancelarRecordatorio(recordatorioId: string) {
    try {
      await cancelarRecordatorioMensaje(recordatorioId)
      cargarRecordatorios()
    } catch (err) {
      showAppAlert('No se pudo cancelar el recordatorio', getErrorMessage(err))
    }
  }

  function handleRecordar(fila: SavedMessageRow) {
    const existente = recordatorios.get(fila.id)
    if (existente) {
      showAppAlert('Recordatorio pendiente', 'Ya tenés un recordatorio programado para este mensaje.', [
        { text: 'Cerrar', style: 'cancel' },
        {
          text: 'Cancelar recordatorio',
          style: 'destructive',
          onPress: () => handleCancelarRecordatorio(existente.id),
        },
      ])
      return
    }

    showAppAlert(
      'Recordarme este mensaje',
      undefined,
      [
        ...PRESETS_RECORDATORIO.map((preset) => ({
          text: preset.label,
          onPress: () => programarRecordatorio(fila, calcularFechaPreset(preset.value)),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ]
    )
  }

  return (
    <ScreenContainer>
      <View style={staffStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={staffStyles.headerTitulo}>Mensajes guardados</Text>
      </View>

      <FlatList
        data={filas}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <Text style={staffStyles.vacio}>
            Todavía no guardaste mensajes. Mantené apretado un mensaje y elegí "Guardar" para encontrarlo acá.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable style={staffStyles.card} onPress={() => abrir(item)}>
            <View style={styles.filaEntre}>
              <Text style={[staffStyles.meta, styles.flex]} numberOfLines={1}>
                {item.scope === 'canal'
                  ? `${item.serverName ?? 'Servidor'} › #${item.channelName ?? 'canal'}`
                  : 'Mensaje directo'}{' '}
                · {relativeTime(new Date(item.savedAt).toISOString())}
              </Text>
              <Pressable onPress={() => handleRecordar(item)} hitSlop={8} style={styles.accion}>
                <Ionicons
                  name={recordatorios.has(item.id) ? 'alarm' : 'alarm-outline'}
                  size={18}
                  color={recordatorios.has(item.id) ? colors.primary : colors.mutedForeground}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  quitarMensajeGuardado(item.id)
                  setFilas((prev) => prev.filter((f) => f.id !== item.id))
                }}
                hitSlop={8}
                style={styles.accion}
              >
                <Ionicons name="bookmark" size={18} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={staffStyles.nombre}>{item.authorName}</Text>
            <Text style={staffStyles.texto} numberOfLines={4}>
              {item.preview}
            </Text>
            {recordatorios.has(item.id) ? (
              <Text style={styles.recordatorioTexto}>
                Te lo recordamos el {formatFechaRecordatorio(recordatorios.get(item.id)!.recordarEn)}
              </Text>
            ) : null}
          </Pressable>
        )}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lista: { padding: spacing.lg, gap: spacing.sm },
  filaEntre: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  accion: { padding: spacing.xs },
  recordatorioTexto: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontSize: 12,
  },
})
