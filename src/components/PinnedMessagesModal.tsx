import { useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { desfijarMensaje, listarMensajesFijados } from '@/lib/messages'
import { getErrorMessage } from '@/lib/utils'
import type { ChatMessage } from '@/lib/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

function previewDeMensaje(message: ChatMessage): string {
  if (message.code) return 'Código'
  if (message.content) return message.content
  if (message.attachment) return 'Adjunto'
  return ''
}

export function PinnedMessagesModal({
  visible,
  onClose,
  channelId,
  canUnpin,
  onJumpToMessage,
}: {
  visible: boolean
  onClose: () => void
  channelId: string
  canUnpin: boolean
  onJumpToMessage: (messageId: string) => void
}) {
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    let cancelado = false
    setLoading(true)
    listarMensajesFijados(channelId)
      .then((data) => {
        if (cancelado) return
        setMessages(data)
        setError(null)
      })
      .catch((err) => !cancelado && setError(getErrorMessage(err)))
      .finally(() => !cancelado && setLoading(false))
    return () => {
      cancelado = true
    }
  }, [visible, channelId])

  async function handleUnpin(messageId: string) {
    const previous = messages
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
    try {
      await desfijarMensaje(messageId)
    } catch (err) {
      setMessages(previous)
      setError(getErrorMessage(err))
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Mensajes fijados</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {loading ? (
          <Text style={styles.info}>Cargando…</Text>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : messages.length === 0 ? (
          <Text style={styles.info}>Todavía no hay mensajes fijados en este canal.</Text>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar name={item.author.name} url={item.author.avatarUrl} size={36} />
                <View style={styles.rowBody}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.author} numberOfLines={1}>
                      {item.author.name}
                    </Text>
                    <Text style={styles.timestamp}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.preview} numberOfLines={2}>
                    {previewDeMensaje(item)}
                  </Text>
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => {
                        onJumpToMessage(item.id)
                        onClose()
                      }}
                    >
                      <Ionicons name="arrow-redo-outline" size={14} color={colors.primary} />
                      <Text style={styles.actionLabel}>Ir al mensaje</Text>
                    </Pressable>
                    {canUnpin ? (
                      <Pressable style={styles.actionButton} onPress={() => handleUnpin(item.id)}>
                        <Ionicons name="pin-outline" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.actionLabel, styles.actionMuted]}>Desfijar</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </ScreenContainer>
    </Modal>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  info: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  author: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
    flexShrink: 1,
  },
  timestamp: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  preview: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  actionMuted: {
    color: colors.mutedForeground,
  },
})
