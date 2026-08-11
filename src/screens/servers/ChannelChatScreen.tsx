import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { MessageList } from '@/components/MessageList'
import { MessageComposer } from '@/components/MessageComposer'
import { PromptModal } from '@/components/PromptModal'
import { PinnedMessagesModal } from '@/components/PinnedMessagesModal'
import { SearchModal } from '@/components/SearchModal'
import { NotificationBellButton } from '@/components/NotificationBellButton'
import { useAuth } from '@/hooks/use-auth'
import { useServerExpresiones } from '@/hooks/use-server-expresiones'
import {
  alternarReaccionMensaje,
  editarMensaje,
  eliminarMensaje,
  enviarMensaje,
  listarMensajes,
  suscribirseACanal,
} from '@/lib/messages'
import { subirArchivoChat } from '@/lib/storage'
import { listarServidores } from '@/lib/servers'
import type { ChatMessage, ReplyPreview, ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Channel'>

export function ChannelChatScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId, channelId, channelName } = route.params

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null)
  const [sending, setSending] = useState(false)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [server, setServer] = useState<ServerItem | null>(null)
  const [pinnedOpen, setPinnedOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(
    route.params.highlightMessageId ?? null
  )
  const { emojis, stickers } = useServerExpresiones(serverId)
  const customEmojis = useMemo(
    () => new Map([...emojis, ...stickers].map((e) => [e.nombre, e.url])),
    [emojis, stickers]
  )

  useEffect(() => {
    listarServidores()
      .then((servers) => setServer(servers.find((s) => s.id === serverId) ?? null))
      .catch(() => {})
  }, [serverId])

  useEffect(() => {
    if (route.params.highlightMessageId) {
      setHighlightMessageId(route.params.highlightMessageId)
    }
  }, [route.params.highlightMessageId])

  useEffect(() => {
    if (!highlightMessageId) return
    const timeout = setTimeout(() => setHighlightMessageId(null), 2500)
    return () => clearTimeout(timeout)
  }, [highlightMessageId])

  useEffect(() => {
    listarMensajes(channelId)
      .then(setMessages)
      .catch((err) => console.error('No se pudieron cargar los mensajes', err))

    const unsubscribe = suscribirseACanal(channelId, {
      onNuevoMensaje: (mensaje) => {
        setMessages((prev) => (prev.some((m) => m.id === mensaje.id) ? prev : [...prev, mensaje]))
      },
      onMensajeEditado: (mensaje) => {
        setMessages((prev) => prev.map((m) => (m.id === mensaje.id ? mensaje : m)))
      },
      onMensajeEliminado: (mensajeId) => {
        setMessages((prev) => prev.filter((m) => m.id !== mensajeId))
      },
    })

    return unsubscribe
  }, [channelId])

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!userId) return
      setSending(true)
      try {
        const nuevo = await enviarMensaje(channelId, userId, {
          content: text,
          respuestaAId: replyingTo?.id,
        })
        setMessages((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]))
        setReplyingTo(null)
      } catch (err) {
        console.error('No se pudo enviar el mensaje', err)
      } finally {
        setSending(false)
      }
    },
    [channelId, replyingTo, userId]
  )

  async function handlePickAttachment() {
    if (!user) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    try {
      setSending(true)
      const { url, tipo } = await subirArchivoChat(channelId, {
        uri: asset.uri,
        name: asset.fileName ?? `adjunto.${asset.uri.split('.').pop()}`,
        type: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        size: asset.fileSize,
      })
      const nuevo = await enviarMensaje(channelId, user.id, {
        attachment: { url, type: tipo === 'imagen' ? 'image' : 'video' },
      })
      setMessages((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]))
    } catch (err) {
      console.error('No se pudo enviar el adjunto', err)
    } finally {
      setSending(false)
    }
  }

  function handleLongPressMessage(message: ChatMessage) {
    const options: { text: string; onPress?: () => void; style?: 'destructive' | 'cancel' }[] = [
      {
        text: 'Responder',
        onPress: () =>
          setReplyingTo({
            id: message.id,
            authorName: message.author.name,
            preview: message.content ?? (message.code ? 'Código' : 'Adjunto'),
          }),
      },
      { text: 'Reaccionar con 👍', onPress: () => alternarReaccionMensaje(message.id, '👍') },
    ]
    if (user && message.author.id === user.id) {
      options.push({
        text: 'Editar',
        onPress: () => setEditingMessage(message),
      })
      options.push({
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => eliminarMensaje(message.id).catch((err) => console.error(err)),
      })
    }
    options.push({ text: 'Cancelar', style: 'cancel' })
    Alert.alert('Mensaje', undefined, options)
  }

  function handleJumpToMessage(messageId: string) {
    setHighlightMessageId(messageId)
  }

  function handleJumpToChannelMessage(targetChannelId: string, messageId: string, targetChannelName: string) {
    if (targetChannelId === channelId) {
      handleJumpToMessage(messageId)
      return
    }
    navigation.navigate('Channel', {
      serverId,
      channelId: targetChannelId,
      channelName: targetChannelName,
      highlightMessageId: messageId,
    })
  }

  const canUnpin = Boolean(server && userId && server.ownerId === userId)

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Ionicons name="chatbubble-outline" size={16} color={colors.mutedForeground} />
        <Text style={styles.title} numberOfLines={1}>
          {channelName}
        </Text>
        <View style={styles.headerActions}>
          <NotificationBellButton size={19} />
          <Pressable onPress={() => setPinnedOpen(true)} hitSlop={8}>
            <Ionicons name="pin-outline" size={19} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => setSearchOpen(true)} hitSlop={8}>
            <Ionicons name="search-outline" size={19} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('ServerMembers', { serverId })}
            hitSlop={8}
          >
            <Ionicons name="people-outline" size={19} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <MessageList
          messages={messages}
          onToggleReaction={alternarReaccionMensaje}
          onLongPressMessage={handleLongPressMessage}
          highlightMessageId={highlightMessageId}
          customEmojis={customEmojis}
        />
        <MessageComposer
          placeholder={`Mensaje en #${channelName}`}
          onSubmit={handleSubmit}
          onPickAttachment={handlePickAttachment}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          sending={sending}
        />
      </KeyboardAvoidingView>

      <PromptModal
        visible={editingMessage !== null}
        title="Editar mensaje"
        initialValue={editingMessage?.content ?? ''}
        onCancel={() => setEditingMessage(null)}
        onConfirm={(value) => {
          if (editingMessage) editarMensaje(editingMessage.id, value).catch((err) => console.error(err))
          setEditingMessage(null)
        }}
      />

      <PinnedMessagesModal
        visible={pinnedOpen}
        onClose={() => setPinnedOpen(false)}
        channelId={channelId}
        canUnpin={canUnpin}
        onJumpToMessage={handleJumpToMessage}
      />

      <SearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        serverId={serverId}
        channelId={channelId}
        onJumpToMessage={handleJumpToChannelMessage}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
})
