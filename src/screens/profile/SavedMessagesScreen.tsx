import { useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import {
  listarMensajesGuardados,
  quitarMensajeGuardado,
  useCantidadMensajesGuardados,
  type SavedMessageRow,
} from '@/lib/saved-messages'
import { relativeTime } from '@/lib/internal/core-utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/theme'
import { staffStyles } from '@/screens/staff/staff-ui'

export function SavedMessagesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [filas, setFilas] = useState<SavedMessageRow[]>([])
  const cantidad = useCantidadMensajesGuardados()

  useEffect(() => {
    listarMensajesGuardados().then(setFilas)
  }, [cantidad])

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
              <Pressable
                onPress={() => {
                  quitarMensajeGuardado(item.id)
                  setFilas((prev) => prev.filter((f) => f.id !== item.id))
                }}
                hitSlop={8}
              >
                <Ionicons name="bookmark" size={18} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={staffStyles.nombre}>{item.authorName}</Text>
            <Text style={staffStyles.texto} numberOfLines={4}>
              {item.preview}
            </Text>
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
})
