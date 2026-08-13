import { useCallback, useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { MessageList } from '@/components/MessageList'
import { MessageComposer } from '@/components/MessageComposer'
import { PromptModal } from '@/components/PromptModal'
import { MessageActionsModal, type MessageActionItem } from '@/components/MessageActionsModal'
import { EmojiPickerModal } from '@/components/EmojiPickerModal'
import { UserProfileModal } from '@/components/UserProfileModal'
import { useAuth } from '@/hooks/use-auth'
import {
  alternarReaccionMensajeDirecto,
  editarMensajeDirecto,
  eliminarMensajeDirecto,
  enviarMensajeDirecto,
  listarMensajesDirectos,
  marcarConversacionLeida,
  obtenerConversacion,
  suscribirseAConversacion,
} from '@/lib/dms'
import { subirArchivoChat } from '@/lib/storage'
import type { ChatMessage, DMConversation, ReplyPreview } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'DMChat'>

export function DMChatScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { conversationId } = route.params

  const [conversation, setConversation] = useState<DMConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null)
  const [sending, setSending] = useState(false)
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [actionsMessage, setActionsMessage] = useState<ChatMessage | null>(null)
  const [reactingMessage, setReactingMessage] = useState<ChatMessage | null>(null)

  useEffect(() => {
    if (!userId) return
    obtenerConversacion(conversationId, userId)
      .then(setConversation)
      .catch((err) => console.error('No se pudo cargar la conversación', err))

    listarMensajesDirectos(conversationId)
      .then(setMessages)
      .catch((err) => console.error('No se pudieron cargar los mensajes', err))

    marcarConversacionLeida(conversationId).catch(() => {})

    const unsubscribe = suscribirseAConversacion(conversationId, {
      onNuevoMensaje: (mensaje) => {
        setMessages((prev) => (prev.some((m) => m.id === mensaje.id) ? prev : [...prev, mensaje]))
        marcarConversacionLeida(conversationId).catch(() => {})
      },
      onMensajeEditado: (mensaje) => {
        setMessages((prev) => prev.map((m) => (m.id === mensaje.id ? mensaje : m)))
      },
      onMensajeEliminado: (mensajeId) => {
        setMessages((prev) => prev.filter((m) => m.id !== mensajeId))
      },
    })

    return unsubscribe
  }, [conversationId, userId])

  const handleSubmit = useCallback(
    async (text: string) => {
      setSending(true)
      try {
        const nuevo = await enviarMensajeDirecto(conversationId, {
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
    [conversationId, replyingTo]
  )

  async function handlePickAttachment() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    try {
      setSending(true)
      const { url, tipo } = await subirArchivoChat(conversationId, {
        uri: asset.uri,
        name: asset.fileName ?? `adjunto.${asset.uri.split('.').pop()}`,
        type: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        size: asset.fileSize,
      })
      const nuevo = await enviarMensajeDirecto(conversationId, {
        attachment: { url, type: tipo === 'imagen' ? 'image' : 'video' },
      })
      setMessages((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]))
    } catch (err) {
      console.error('No se pudo enviar el adjunto', err)
    } finally {
      setSending(false)
    }
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
        onPress: () => eliminarMensajeDirecto(message.id).catch((err) => console.error(err)),
      })
    }
    return actions
  }

  function handleLongPressMessage(message: ChatMessage) {
    setActionsMessage(message)
  }

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        {conversation ? (
          <Pressable
            style={styles.headerUser}
            onPress={() => setProfileUserId(conversation.otherUser.id)}
          >
            <Avatar
              name={conversation.otherUser.name}
              url={conversation.otherUser.avatarUrl}
              status={conversation.otherUser.status}
              size={32}
            />
            <Text style={styles.title} numberOfLines={1}>
              {conversation.otherUser.name}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 38}
      >
        <MessageList
          messages={messages}
          onToggleReaction={alternarReaccionMensajeDirecto}
          onLongPressMessage={handleLongPressMessage}
          onPressAuthor={setProfileUserId}
        />
        <MessageComposer
          placeholder={conversation ? `Mensaje a ${conversation.otherUser.name}` : 'Mensaje'}
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
          if (editingMessage) editarMensajeDirecto(editingMessage.id, value).catch((err) => console.error(err))
          setEditingMessage(null)
        }}
      />

      <UserProfileModal
        userId={profileUserId}
        currentUserId={userId ?? ''}
        visible={profileUserId !== null}
        onClose={() => setProfileUserId(null)}
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
          if (reactingMessage) alternarReaccionMensajeDirecto(reactingMessage.id, emoji)
        }}
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
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
    flexShrink: 1,
  },
})
