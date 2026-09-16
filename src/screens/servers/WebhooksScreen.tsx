import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { useAuth } from '@/hooks/use-auth'
import { showAppAlert } from '@/hooks/use-app-alert'
import { useTextChannels } from '@/hooks/use-text-channels'
import {
  actualizarPerfilWebhook,
  crearWebhook,
  eliminarWebhook,
  listarWebhooks,
  type ServerWebhook,
} from '@/lib/webhooks'
import { subirAvatar } from '@/lib/storage'
import { listarServidores } from '@/lib/servers'
import { getErrorMessage } from '@/lib/utils'
import type { ChannelItem, ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Webhooks'>

function CreateWebhookModal({
  visible,
  channels,
  channelsLoading,
  onClose,
  onCreate,
}: {
  visible: boolean
  channels: ChannelItem[]
  channelsLoading: boolean
  onClose: () => void
  onCreate: (nombre: string, canalId: string) => Promise<void>
}) {
  const [nombre, setNombre] = useState('')
  const [canalId, setCanalId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setNombre('')
      setCanalId(null)
      setError(null)
    }
  }, [visible])

  async function handleSubmit() {
    if (!nombre.trim() || !canalId) return
    setCreating(true)
    setError(null)
    try {
      await onCreate(nombre, canalId)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Crear webhook</Text>
          <Text style={styles.cardSubtitle}>
            Elegí un nombre y el canal donde se van a publicar los mensajes.
          </Text>

          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Notificaciones de GitHub"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            autoFocus
          />

          <Text style={styles.fieldLabel}>Canal de destino</Text>
          {channelsLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.channelListLoading} />
          ) : (
            <ScrollView style={styles.channelList} keyboardShouldPersistTaps="handled">
              {channels.map((channel) => (
                <Pressable
                  key={channel.id}
                  style={styles.channelRow}
                  onPress={() => setCanalId(channel.id)}
                >
                  <Ionicons
                    name={channel.type === 'announcement' ? 'megaphone-outline' : 'chatbubble-outline'}
                    size={16}
                    color={colors.mutedForeground}
                  />
                  <Text style={styles.channelRowLabel} numberOfLines={1}>
                    {channel.name}
                  </Text>
                  {canalId === channel.id ? (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, (!nombre.trim() || !canalId || creating) && styles.buttonDisabled]}
              disabled={!nombre.trim() || !canalId || creating}
              onPress={handleSubmit}
            >
              <Text style={styles.confirmLabel}>{creating ? 'Creando…' : 'Crear'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function EditWebhookModal({
  webhook,
  currentUserId,
  onClose,
  onSaved,
}: {
  webhook: ServerWebhook | null
  currentUserId: string
  onClose: () => void
  onSaved: (updated: ServerWebhook) => void
}) {
  const [nombre, setNombre] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (webhook) {
      setNombre(webhook.nombre)
      setAvatarUri(null)
      setError(null)
    }
  }, [webhook])

  async function handlePickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    })
    if (result.canceled || !result.assets[0]) return
    setAvatarUri(result.assets[0].uri)
  }

  async function handleSubmit() {
    if (!webhook || !nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      let avatarUrl = webhook.avatarUrl
      if (avatarUri) {
        avatarUrl = await subirAvatar(currentUserId, {
          uri: avatarUri,
          name: `webhook.${avatarUri.split('.').pop() ?? 'jpg'}`,
          type: 'image/jpeg',
        })
      }
      await actualizarPerfilWebhook(webhook.id, nombre, avatarUrl)
      onSaved({ ...webhook, nombre: nombre.trim(), avatarUrl })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={webhook !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Editar perfil del webhook</Text>
          <Text style={styles.cardSubtitle}>Así se va a ver en los mensajes que publique.</Text>

          <Pressable style={styles.avatarPicker} onPress={handlePickAvatar}>
            {avatarUri || webhook?.avatarUrl ? (
              <Image source={{ uri: avatarUri ?? webhook?.avatarUrl ?? undefined }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="link-outline" size={22} color={colors.mutedForeground} />
              </View>
            )}
            <Text style={styles.avatarPickerLabel}>Cambiar imagen</Text>
          </Pressable>

          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, (!nombre.trim() || saving) && styles.buttonDisabled]}
              disabled={!nombre.trim() || saving}
              onPress={handleSubmit}
            >
              <Text style={styles.confirmLabel}>{saving ? 'Guardando…' : 'Guardar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export function WebhooksScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [webhooks, setWebhooks] = useState<ServerWebhook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ServerWebhook | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { channels, loading: channelsLoading } = useTextChannels(serverId)

  useEffect(() => {
    listarServidores()
      .then((servers) => setServer(servers.find((s) => s.id === serverId) ?? null))
      .catch(() => {})
  }, [serverId])

  useEffect(() => {
    listarWebhooks(serverId)
      .then(setWebhooks)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [serverId])

  const canEdit = Boolean(server && user && server.ownerId === user.id)

  function nombreDelCanal(canalId: string): string {
    return channels.find((c) => c.id === canalId)?.name ?? 'canal eliminado'
  }

  async function handleCopyToken(webhook: ServerWebhook) {
    await Clipboard.setStringAsync(webhook.token)
    setCopiedId(webhook.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function handleDelete(webhook: ServerWebhook) {
    showAppAlert(
      `Eliminar webhook "${webhook.nombre}"`,
      'Cualquier servicio externo que use este token va a dejar de poder enviar mensajes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const previos = webhooks
            setWebhooks((prev) => prev.filter((w) => w.id !== webhook.id))
            try {
              await eliminarWebhook(webhook.id)
            } catch (err) {
              setWebhooks(previos)
              setError(getErrorMessage(err))
            }
          },
        },
      ]
    )
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Webhooks</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Creá webhooks para que servicios externos envíen mensajes a un canal de{' '}
          {server?.name ?? 'este servidor'}. Necesitás un endpoint receptor propio que use el
          token generado.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {canEdit ? (
          <Pressable style={styles.createButton} onPress={() => setCreateOpen(true)}>
            <Ionicons name="add" size={16} color={colors.mutedForeground} />
            <Text style={styles.createButtonLabel}>Crear webhook</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <View style={styles.list}>
            {webhooks.length === 0 ? (
              <Text style={styles.empty}>Todavía no hay webhooks creados.</Text>
            ) : null}

            {webhooks.map((webhook) => (
              <View key={webhook.id} style={styles.webhookRow}>
                {webhook.avatarUrl ? (
                  <Image source={{ uri: webhook.avatarUrl }} style={styles.webhookAvatar} />
                ) : (
                  <View style={styles.webhookAvatarFallback}>
                    <Ionicons name="link-outline" size={18} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.webhookInfo}>
                  <Text style={styles.webhookName} numberOfLines={1}>
                    {webhook.nombre}
                  </Text>
                  <Text style={styles.webhookChannel} numberOfLines={1}>
                    #{nombreDelCanal(webhook.canalId)}
                  </Text>
                </View>
                <Pressable style={styles.iconButton} onPress={() => handleCopyToken(webhook)} hitSlop={8}>
                  <Ionicons
                    name={copiedId === webhook.id ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={colors.foreground}
                  />
                </Pressable>
                {canEdit ? (
                  <>
                    <Pressable style={styles.iconButton} onPress={() => setEditTarget(webhook)} hitSlop={8}>
                      <Ionicons name="pencil-outline" size={16} color={colors.foreground} />
                    </Pressable>
                    <Pressable style={styles.iconButton} onPress={() => handleDelete(webhook)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    </Pressable>
                  </>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {!canEdit && !loading ? (
          <Text style={styles.permissionNote}>No tenés permiso para gestionar webhooks en este servidor.</Text>
        ) : null}
      </ScrollView>

      <CreateWebhookModal
        visible={createOpen}
        channels={channels}
        channelsLoading={channelsLoading}
        onClose={() => setCreateOpen(false)}
        onCreate={async (nombre, canalId) => {
          const webhook = await crearWebhook(serverId, canalId, nombre)
          setWebhooks((prev) => [...prev, webhook])
          setCreateOpen(false)
        }}
      />

      <EditWebhookModal
        webhook={editTarget}
        currentUserId={user?.id ?? ''}
        onClose={() => setEditTarget(null)}
        onSaved={(updated) => {
          setWebhooks((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
          setEditTarget(null)
        }}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
  },
  description: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  createButtonLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  loading: {
    marginTop: spacing.xl,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  webhookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  webhookAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
  },
  webhookAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webhookInfo: {
    flex: 1,
    minWidth: 0,
  },
  webhookName: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  webhookChannel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionNote: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    marginTop: spacing.lg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  channelList: {
    maxHeight: 160,
    marginTop: spacing.xs,
  },
  channelListLoading: {
    marginTop: spacing.sm,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  channelRowLabel: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  avatarPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPickerLabel: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
})
