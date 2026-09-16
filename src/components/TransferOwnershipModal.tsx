import { useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text } from 'react-native'

import { Avatar } from '@/components/Avatar'
import { showAppAlert } from '@/hooks/use-app-alert'
import { useAuth } from '@/hooks/use-auth'
import { listarMiembros, type ServerMember } from '@/lib/members'
import { transferirTitularidad } from '@/lib/servers'
import { getErrorMessage } from '@/lib/utils'
import type { ServerItem } from '@/lib/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function TransferOwnershipModal({
  visible,
  serverId,
  onClose,
  onDone,
}: {
  visible: boolean
  serverId: string
  onClose: () => void
  onDone: (server: ServerItem) => void
}) {
  const { user } = useAuth()
  const [members, setMembers] = useState<ServerMember[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!visible) return
    listarMiembros(serverId)
      .then((m) => setMembers(m.filter((x) => x.user.id !== user?.id)))
      .catch(() => setMembers([]))
  }, [visible, serverId, user?.id])

  function confirmar(m: ServerMember) {
    showAppAlert(
      'Transferir propiedad',
      `¿Pasar la propiedad del servidor a ${m.user.name}? Vas a dejar de ser el dueño.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Transferir',
          style: 'destructive',
          onPress: async () => {
            setBusy(true)
            try {
              onDone(await transferirTitularidad(serverId, m.user.id))
            } catch (err) {
              showAppAlert('Error', getErrorMessage(err))
            } finally {
              setBusy(false)
            }
          },
        },
      ]
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Transferir propiedad a…</Text>
          <ScrollView style={styles.list}>
            {members.length === 0 ? (
              <Text style={styles.empty}>No hay otros miembros.</Text>
            ) : (
              members.map((m) => (
                <Pressable
                  key={m.user.id}
                  style={styles.row}
                  disabled={busy}
                  onPress={() => confirmar(m)}
                >
                  <Avatar name={m.user.name} url={m.user.avatarUrl} size={32} />
                  <Text style={styles.name} numberOfLines={1}>
                    {m.nickname || m.user.name}
                  </Text>
                </Pressable>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.sm },
  empty: { color: colors.mutedForeground, fontSize: fontSize.sm, padding: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: { color: colors.foreground, fontSize: fontSize.md, flex: 1 },
})
