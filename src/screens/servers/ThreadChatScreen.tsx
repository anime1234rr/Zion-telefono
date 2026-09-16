import { useCallback, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { MessageList } from '@/components/MessageList'
import { MessageComposer } from '@/components/MessageComposer'
import { ImageViewerModal } from '@/components/ImageViewerModal'
import { PromptModal } from '@/components/PromptModal'
import { MessageActionsModal, type MessageActionItem } from '@/components/MessageActionsModal'
import { EmojiPickerModal } from '@/components/EmojiPickerModal'
import { UserProfileModal } from '@/components/UserProfileModal'
import { useAuth } from '@/hooks/use-auth'
import { useCurrentUsername } from '@/hooks/use-current-username'
import { useServerExpresiones } from '@/hooks/use-server-expresiones'
import {
  alternarReaccionMensaje,
  editarMensaje,
  eliminarMensaje,
  enviarMensaje,
  listarMensajes,
  suscribirseACanal,
} from '@/lib/messages'
import { obtenerOCrearConversacion } from '@/lib/dms'
import { subirArchivoChat } from '@/lib/storage'
import { listarMiembrosParaMencion, listarRolesDeServidor, type MentionableMember, type ServerRole } from '@/lib/members'
import { parseFencedCode } from '@/lib/code-fence'
import type { ChatMessage, ReplyPreview } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ThreadChat'>

export function ThreadChatScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId, threadId, threadName, locked } = route.params

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null)
  const [sending, setSending] = useState(false)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [actionsMessage, setActionsMessage] = useState<ChatMessage | null>(null)
  const [reactingMessage, setReactingMessage] = useState<ChatMessage | null>(null)
  const [viewerUri, setViewerUri] = useState<string | null>(null)
  const [members, setMembers] = useState<MentionableMember[]>([])
  const [roles, setRoles] = useState<ServerRole[]>([])

  const currentUsername = useCurrentUsername()
  const { emojis, stickers } = useServerExpresiones(serverId)

  useEffect(() => {
    listarMiembrosParaMencion(serverId).then(setMembers).catch(() => {})
    listarRolesDeServidor(serverId).then(setRoles).catch(() => {})
  }, [serverId])
  const customEmojis = useMemo(
    () => new Map([...emojis, ...stickers].map((e) => [e.nombre, e.url])),
    [emojis, stickers]
  )

  useEffect(() => {
    listarMensajes(threadId)
      .then(setMessages)
      .catch((err) => console.error('No se pudieron cargar los mensajes del hilo', err))

    return suscribirseACanal(threadId, {
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
  }, [threadId])

  const handleSubmit = useCallback(
    async (text: string) => {
      if (!userId) return
      setSending(true)
      try {
        const parsed = parseFencedCode(text)
        const nuevo = await enviarMensaje(threadId, userId, {
          ...(parsed.code ? { code: parsed.code } : { content: text }),
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
    [threadId, replyingTo, userId]
  )

  async function handleSendSticker(nombre: string) {
    if (!userId) return
    try {
      const nuevo = await enviarMensaje(threadId, userId, { content: `:${nombre}:` })
      setMessages((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]))
    } catch (err) {
      console.error('No se pudo enviar el sticker', err)
    }
  }

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
      const { url, tipo } = await subirArchivoChat(threadId, {
        uri: asset.uri,
        name: asset.fileName ?? `adjunto.${asset.uri.split('.').pop()}`,
        type: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        size: asset.fileSize,
      })
      const nuevo = await enviarMensaje(threadId, user.id, {
        attachment: { url, type: tipo === 'imagen' ? 'image' : 'video' },
      })
      setMessages((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]))
    } catch (err) {
      console.error('No se pudo enviar el adjunto', err)
    } finally {
      setSending(false)
    }
  }

  async function handleMessageUser(targetUserId: string) {
    const conversationId = await obtenerOCrearConversacion(targetUserId)
    navigation.navigate('DMChat', { conversationId })
  }

  function buildMessageActions(message: ChatMessage): MessageActionItem[] {
    const actions: MessageActionItem[] = [
      {
        key: 'reply',
        label: 'Responder',
        icon: 'arrow-undo-outline',
        onPress: () =>
          setReplyingTo({
            id: message.id,
            authorName: message.author.name,
            preview: message.content ?? (message.code ? 'Código' : 'Adjunto'),
          }),
      },
      {
        key: 'react',
        label: 'Reaccionar',
        icon: 'happy-outline',
        onPress: () => setReactingMessage(message),
      },
    ]
    if (user && message.author.id === user.id) {
      actions.push({
        key: 'edit',
        label: 'Editar',
        icon: 'pencil-outline',
        onPress: () => setEditingMessage(message),
      })
      actions.push({
        key: 'delete',
        label: 'Eliminar',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => eliminarMensaje(message.id).catch((err) => console.error(err)),
      })
    }
    return actions
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Ionicons
          name={locked ? 'lock-closed-outline' : 'chatbox-ellipses-outline'}
          size={16}
          color={colors.mutedForeground}
        />
        <Text style={styles.title} numberOfLines={1}>
          {threadName}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 38}
      >
        <MessageList
          messages={messages}
          onToggleReaction={alternarReaccionMensaje}
          onLongPressMessage={setActionsMessage}
          onPressAuthor={setProfileUserId}
          customEmojis={customEmojis}
          currentUserId={userId}
          currentUsername={currentUsername}
          onOpenImage={setViewerUri}
        />
        {locked ? (
          <View style={styles.lockedNote}>
            <Ionicons name="lock-closed-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.lockedText}>Este hilo está cerrado.</Text>
          </View>
        ) : (
          <MessageComposer
            placeholder={`Mensaje en ${threadName}`}
            onSubmit={handleSubmit}
            onPickAttachment={handlePickAttachment}
            onSendSticker={handleSendSticker}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            sending={sending}
            members={members}
            roles={roles}
            customEmojis={customEmojis}
            stickers={stickers}
          />
        )}
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

      <UserProfileModal
        userId={profileUserId}
        currentUserId={userId ?? ''}
        visible={profileUserId !== null}
        onClose={() => setProfileUserId(null)}
        onMessageUser={handleMessageUser}
      />

      <MessageActionsModal
        visible={actionsMessage !== null}
        actions={actionsMessage ? buildMessageActions(actionsMessage) : []}
        onClose={() => setActionsMessage(null)}
      />

      <EmojiPickerModal
        visible={reactingMessage !== null}
        onClose={() => setReactingMessage(null)}
        onSelect={(emoji) => {
          if (reactingMessage) alternarReaccionMensaje(reactingMessage.id, emoji)
        }}
      />

      <ImageViewerModal uri={viewerUri} onClose={() => setViewerUri(null)} />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  lockedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  lockedText: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
})
