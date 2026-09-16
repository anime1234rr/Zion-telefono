import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { PromptModal } from '@/components/PromptModal'
import {
  crearHiloDeCanal,
  listarHilosDeCanal,
  suscribirseAHilosDeCanal,
  type ChannelThread,
} from '@/lib/threads'
import { formatTimestamp } from '@/lib/message-format'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ThreadList'>

export function ThreadListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId, channelId, channelName } = route.params

  const [threads, setThreads] = useState<ChannelThread[]>([])
  const [creating, setCreating] = useState(false)

  const cargar = useCallback(() => {
    listarHilosDeCanal(channelId)
      .then(setThreads)
      .catch((err) => console.error('No se pudieron cargar los hilos', err))
  }, [channelId])

  useEffect(() => {
    cargar()
    return suscribirseAHilosDeCanal(channelId, cargar)
  }, [channelId, cargar])

  async function handleCrear(nombre: string) {
    setCreating(false)
    if (!nombre.trim()) return
    try {
      const hiloId = await crearHiloDeCanal(channelId, nombre)
      navigation.navigate('ThreadChat', { serverId, threadId: hiloId, threadName: nombre.trim() })
    } catch (err) {
      console.error('No se pudo crear el hilo', err)
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Ionicons name="git-branch-outline" size={16} color={colors.mutedForeground} />
        <Text style={styles.title} numberOfLines={1}>
          Hilos de #{channelName}
        </Text>
        <Pressable onPress={() => setCreating(true)} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {threads.length === 0 ? (
        <EmptyState title="No hay hilos" description="Tocá + para abrir uno." />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate('ThreadChat', {
                  serverId,
                  threadId: item.id,
                  threadName: item.nombre,
                  locked: item.locked,
                })
              }
            >
              {item.pinned ? <Ionicons name="pin" size={13} color={colors.primary} /> : null}
              {item.locked ? (
                <Ionicons name="lock-closed" size={13} color={colors.mutedForeground} />
              ) : null}
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <View style={styles.rowMetaLine}>
                  <Avatar name={item.author.name} url={item.author.avatarUrl} size={16} />
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {item.author.name} · {item.messageCount} mensaje
                    {item.messageCount === 1 ? '' : 's'} · {formatTimestamp(item.lastActivityAt)}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        />
      )}

      <PromptModal
        visible={creating}
        title="Nuevo hilo"
        initialValue=""
        confirmLabel="Crear"
        onCancel={() => setCreating(false)}
        onConfirm={handleCrear}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  list: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  rowMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowMeta: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
})
