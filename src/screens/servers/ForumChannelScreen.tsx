import { useCallback, useEffect, useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  crearEtiquetaForo,
  crearHiloForo,
  eliminarEtiquetaForo,
  listarEtiquetasDeForo,
  listarHilosDeForo,
  suscribirseAHilosDeForo,
  type ForumTag,
  type ForumThread,
} from '@/lib/forums'
import { getErrorMessage } from '@/lib/utils'
import { formatTimestamp } from '@/lib/message-format'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ForumChannel'>

function ThreadCard({ thread, onPress }: { thread: ForumThread; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeaderRow}>
        {thread.pinned ? <Ionicons name="pin" size={13} color={colors.primary} /> : null}
        {thread.locked ? (
          <Ionicons name="lock-closed" size={13} color={colors.mutedForeground} />
        ) : null}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {thread.title}
        </Text>
      </View>

      {thread.body ? (
        <Text style={styles.cardBody} numberOfLines={2}>
          {thread.body}
        </Text>
      ) : null}

      {thread.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {thread.tags.map((tag) => (
            <View key={tag.id} style={[styles.tag, { borderColor: tag.color }]}>
              <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
              <Text style={styles.tagText}>{tag.name}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.cardFooter}>
        <Avatar name={thread.author.name} url={thread.author.avatarUrl} size={18} />
        <Text style={styles.cardMeta} numberOfLines={1}>
          {thread.author.name} · {thread.messageCount} mensaje
          {thread.messageCount === 1 ? '' : 's'} · {formatTimestamp(thread.lastActivityAt)}
        </Text>
      </View>
    </Pressable>
  )
}

export function ForumChannelScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId, channelId, channelName } = route.params

  const [threads, setThreads] = useState<ForumThread[]>([])
  const [tags, setTags] = useState<ForumTag[]>([])
  const [creating, setCreating] = useState(false)
  const [managingTags, setManagingTags] = useState(false)
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevoCuerpo, setNuevoCuerpo] = useState('')
  const [tagsSel, setTagsSel] = useState<string[]>([])
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(() => {
    listarHilosDeForo(channelId)
      .then(setThreads)
      .catch((err) => console.error('No se pudieron cargar los hilos del foro', err))
    listarEtiquetasDeForo(channelId).then(setTags).catch(() => {})
  }, [channelId])

  useEffect(() => {
    cargar()
    return suscribirseAHilosDeForo(channelId, cargar)
  }, [channelId, cargar])

  const COLORES_TAG = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#ec4899', '#06b6d4']

  async function handleAgregarEtiqueta() {
    if (!nuevaEtiqueta.trim()) return
    try {
      const t = await crearEtiquetaForo(
        channelId,
        nuevaEtiqueta,
        COLORES_TAG[tags.length % COLORES_TAG.length]
      )
      setTags((prev) => [...prev, t])
      setNuevaEtiqueta('')
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    }
  }

  async function handleEliminarEtiqueta(id: string) {
    try {
      await eliminarEtiquetaForo(id)
      setTags((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    }
  }

  async function handleCrear() {
    if (!nuevoTitulo.trim()) return
    setGuardando(true)
    try {
      const hiloId = await crearHiloForo(channelId, nuevoTitulo, nuevoCuerpo, tagsSel)
      setCreating(false)
      setNuevoTitulo('')
      setNuevoCuerpo('')
      setTagsSel([])
      navigation.navigate('ThreadChat', {
        serverId,
        threadId: hiloId,
        threadName: nuevoTitulo.trim(),
      })
    } catch (err) {
      console.error('No se pudo crear el hilo', err)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.mutedForeground} />
        <Text style={styles.title} numberOfLines={1}>
          {channelName}
        </Text>
        <Pressable onPress={() => setManagingTags(true)} hitSlop={8}>
          <Ionicons name="pricetags-outline" size={20} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={() => setCreating(true)} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {threads.length === 0 ? (
        <EmptyState
          title="Todavía no hay publicaciones"
          description="Tocá + para crear la primera."
        />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThreadCard
              thread={item}
              onPress={() =>
                navigation.navigate('ThreadChat', {
                  serverId,
                  threadId: item.id,
                  threadName: item.title,
                  locked: item.locked,
                })
              }
            />
          )}
        />
      )}

      <Modal visible={creating} transparent animationType="fade" onRequestClose={() => setCreating(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Nueva publicación</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={colors.mutedForeground}
              value={nuevoTitulo}
              onChangeText={setNuevoTitulo}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Escribí algo (opcional)"
              placeholderTextColor={colors.mutedForeground}
              value={nuevoCuerpo}
              onChangeText={setNuevoCuerpo}
              multiline
            />
            {tags.length > 0 ? (
              <View style={styles.tagRow}>
                {tags.map((t) => {
                  const on = tagsSel.includes(t.id)
                  return (
                    <Pressable
                      key={t.id}
                      style={[styles.tag, { borderColor: t.color }, on && { backgroundColor: t.color }]}
                      onPress={() =>
                        setTagsSel((prev) =>
                          prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id]
                        )
                      }
                    >
                      <Text style={[styles.tagText, on && { color: '#fff' }]}>{t.name}</Text>
                    </Pressable>
                  )
                })}
              </View>
            ) : null}
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setCreating(false)}>
                <Text style={styles.dialogCancel}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleCrear}
                disabled={guardando || !nuevoTitulo.trim()}
                style={[styles.dialogConfirm, (!nuevoTitulo.trim() || guardando) && styles.dialogConfirmDisabled]}
              >
                <Text style={styles.dialogConfirmText}>{guardando ? 'Creando…' : 'Publicar'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={managingTags}
        transparent
        animationType="fade"
        onRequestClose={() => setManagingTags(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Etiquetas del foro</Text>
            {tags.map((t) => (
              <View key={t.id} style={styles.manageRow}>
                <View style={[styles.tagDot, { backgroundColor: t.color }]} />
                <Text style={styles.manageName}>{t.name}</Text>
                <Pressable onPress={() => handleEliminarEtiqueta(t.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            ))}
            <View style={styles.manageAdd}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Nueva etiqueta"
                placeholderTextColor={colors.mutedForeground}
                value={nuevaEtiqueta}
                onChangeText={setNuevaEtiqueta}
              />
              <Pressable
                style={[styles.dialogConfirm, !nuevaEtiqueta.trim() && styles.dialogConfirmDisabled]}
                onPress={handleAgregarEtiqueta}
                disabled={!nuevaEtiqueta.trim()}
              >
                <Text style={styles.dialogConfirmText}>Añadir</Text>
              </Pressable>
            </View>
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setManagingTags(false)}>
                <Text style={styles.dialogCancel}>Cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: fontSize.lg,
    fontWeight: '700',
    flex: 1,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  cardBody: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  tagText: {
    color: colors.foreground,
    fontSize: fontSize.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
  },
  cardMeta: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dialogTitle: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
  },
  dialogCancel: {
    color: colors.mutedForeground,
    fontSize: fontSize.md,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  manageName: { flex: 1, color: colors.foreground, fontSize: fontSize.sm },
  manageAdd: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  dialogConfirm: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  dialogConfirmDisabled: {
    opacity: 0.5,
  },
  dialogConfirmText: {
    color: colors.primaryForeground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
