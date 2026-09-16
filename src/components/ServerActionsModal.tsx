import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'

import { showAppAlert } from '@/hooks/use-app-alert'
import { abandonarServidor, eliminarServidor } from '@/lib/servers'
import { getErrorMessage } from '@/lib/utils'
import {
  olvidarServerNotifPref,
  setServerAlertLevel,
  toggleServerMuted,
  useServerNotifPref,
  type ServerAlertLevel,
} from '@/lib/server-notification-prefs'
import type { ServerItem } from '@/lib/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const NIVELES: { value: ServerAlertLevel; label: string }[] = [
  { value: 'todas', label: 'Todos' },
  { value: 'menciones', label: 'Menciones' },
  { value: 'nada', label: 'Nada' },
]

export function ServerActionsModal({
  server,
  currentUserId,
  visible,
  onClose,
  onOpenSettings,
  onLeft,
  onDeleted,
}: {
  server: ServerItem | null
  currentUserId: string
  visible: boolean
  onClose: () => void
  onOpenSettings: (serverId: string) => void
  onLeft: (serverId: string) => void
  onDeleted: (serverId: string) => void
}) {
  const notif = useServerNotifPref(server?.id ?? '')
  const isOwner = !!server && server.ownerId === currentUserId

  function confirmarSalida() {
    if (!server) return
    onClose()
    showAppAlert(`¿Abandonar "${server.name}"?`, 'Vas a dejar de ver sus canales. Podés volver con una invitación.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abandonar',
        style: 'destructive',
        onPress: () => {
          abandonarServidor(server.id)
            .then(() => {
              olvidarServerNotifPref(server.id)
              onLeft(server.id)
            })
            .catch((err) => showAppAlert('No se pudo abandonar el servidor', getErrorMessage(err)))
        },
      },
    ])
  }

  function confirmarEliminar() {
    if (!server) return
    onClose()
    showAppAlert(
      `¿Eliminar "${server.name}"?`,
      'Se borran todos sus canales, roles y mensajes para todos los miembros. No se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            eliminarServidor(server.id)
              .then(() => {
                olvidarServerNotifPref(server.id)
                onDeleted(server.id)
              })
              .catch((err) => showAppAlert('No se pudo eliminar el servidor', getErrorMessage(err)))
          },
        },
      ]
    )
  }

  async function copiar(texto: string, mensaje: string) {
    onClose()
    await Clipboard.setStringAsync(texto)
    showAppAlert(mensaje)
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {server ? (
            <>
              <Text style={styles.header} numberOfLines={1}>
                {server.name}
              </Text>

              <Pressable style={styles.row} onPress={() => toggleServerMuted(server.id)}>
                <Ionicons
                  name={notif.muted ? 'notifications-off' : 'notifications-outline'}
                  size={18}
                  color={colors.foreground}
                />
                <Text style={styles.label}>Silenciar servidor</Text>
                <View style={[styles.check, notif.muted && styles.checkOn]}>
                  {notif.muted ? <Ionicons name="checkmark" size={13} color={colors.primaryForeground} /> : null}
                </View>
              </Pressable>

              <View style={styles.segmentRow}>
                {NIVELES.map((n) => {
                  const activo = notif.level === n.value
                  return (
                    <Pressable
                      key={n.value}
                      disabled={notif.muted}
                      style={[styles.segment, activo && styles.segmentActive, notif.muted && styles.segmentDisabled]}
                      onPress={() => setServerAlertLevel(server.id, n.value)}
                    >
                      <Text style={[styles.segmentText, activo && styles.segmentTextActive]}>{n.label}</Text>
                    </Pressable>
                  )
                })}
              </View>

              <View style={styles.divider} />

              {isOwner ? (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onClose()
                    onOpenSettings(server.id)
                  }}
                >
                  <Ionicons name="settings-outline" size={18} color={colors.foreground} />
                  <Text style={styles.label}>Ajustes del servidor</Text>
                </Pressable>
              ) : null}

              {server.inviteCode ? (
                <Pressable
                  style={styles.row}
                  onPress={() => copiar(server.inviteCode as string, 'Código de invitación copiado')}
                >
                  <Ionicons name="link-outline" size={18} color={colors.foreground} />
                  <Text style={styles.label}>Copiar código de invitación</Text>
                </Pressable>
              ) : null}

              <Pressable style={styles.row} onPress={() => copiar(server.id, 'ID del servidor copiado')}>
                <Ionicons name="copy-outline" size={18} color={colors.foreground} />
                <Text style={styles.label}>Copiar ID del servidor</Text>
              </Pressable>

              <View style={styles.divider} />

              {isOwner ? (
                <Pressable style={styles.row} onPress={confirmarEliminar}>
                  <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  <Text style={[styles.label, styles.labelDestructive]}>Eliminar servidor</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.row} onPress={confirmarSalida}>
                  <Ionicons name="exit-outline" size={18} color={colors.destructive} />
                  <Text style={[styles.label, styles.labelDestructive]}>Abandonar servidor</Text>
                </Pressable>
              )}

              <View style={styles.divider} />
              <Pressable style={styles.row} onPress={onClose}>
                <Text style={styles.cancel}>Cancelar</Text>
              </Pressable>
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
  },
  header: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  labelDestructive: {
    color: colors.destructive,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  segmentDisabled: {
    opacity: 0.4,
  },
  segmentText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.foreground,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  cancel: {
    color: colors.mutedForeground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
