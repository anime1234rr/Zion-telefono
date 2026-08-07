import { useCallback, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/use-auth'
import {
  eliminarNotificacion,
  listarNotificaciones,
  marcarNotificacionLeida,
  type AppNotification,
  type NotificationType,
} from '@/lib/notifications'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const TYPE_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  mencion: 'at-outline',
  invitacion: 'mail-outline',
  sistema: 'settings-outline',
  mensaje_privado: 'chatbubble-outline',
  solicitud_amistad: 'person-add-outline',
}

function formatRelativo(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  const diffHoras = Math.floor(diffMin / 60)
  if (diffHoras < 24) return `hace ${diffHoras} h`
  const diffDias = Math.floor(diffHoras / 24)
  if (diffDias < 7) return `hace ${diffDias} d`
  return date.toLocaleDateString('es-AR')
}

export function NotificationsScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [notificaciones, setNotificaciones] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AppNotification | null>(null)

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      listarNotificaciones(userId)
        .then(setNotificaciones)
        .catch((err) => console.error('No se pudieron cargar las notificaciones', err))
        .finally(() => setLoading(false))
    }, [userId])
  )

  const noLeidas = notificaciones.filter((n) => !n.leida).length

  async function handleMarcarLeida(notificacionId: string) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === notificacionId ? { ...n, leida: true } : n))
    )
    try {
      await marcarNotificacionLeida(notificacionId)
    } catch (err) {
      console.error('No se pudo marcar la notificación como leída', err)
    }
  }

  async function handleMarcarTodasLeidas() {
    const previas = notificaciones
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })))
    try {
      await marcarNotificacionLeida()
    } catch (err) {
      setNotificaciones(previas)
      console.error('No se pudieron marcar las notificaciones como leídas', err)
    }
  }

  async function handleEliminar(notificacionId: string) {
    const previas = notificaciones
    setNotificaciones((prev) => prev.filter((n) => n.id !== notificacionId))
    try {
      await eliminarNotificacion(notificacionId)
    } catch (err) {
      setNotificaciones(previas)
      console.error('No se pudo eliminar la notificación', err)
    }
  }

  function handleOpen(n: AppNotification) {
    setSelected(n)
    if (!n.leida) handleMarcarLeida(n.id)
  }

  function handleIrAlServidor() {
    if (!selected?.servidorId) return
    const serverId = selected.servidorId
    setSelected(null)
    navigation.navigate('ServerChannels', { serverId })
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Notificaciones</Text>
        {noLeidas > 0 ? (
          <Pressable onPress={handleMarcarTodasLeidas} hitSlop={8}>
            <Text style={styles.markAllLabel}>Marcar leídas</Text>
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
      </View>

      {selected ? (
        <View style={styles.detail}>
          <View style={styles.detailHeader}>
            <Ionicons name={TYPE_ICON[selected.tipo]} size={20} color={colors.primary} />
            <Text style={styles.detailTitle}>{selected.titulo}</Text>
          </View>
          <Text style={styles.detailMessage}>{selected.mensaje}</Text>
          <Text style={styles.detailMeta}>{formatRelativo(selected.creadoAt)}</Text>
          <View style={styles.detailActions}>
            {selected.servidorId ? (
              <Pressable style={styles.detailButton} onPress={handleIrAlServidor}>
                <Text style={styles.detailButtonLabel}>Ir al servidor</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.detailCloseButton} onPress={() => setSelected(null)}>
              <Text style={styles.detailCloseLabel}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      ) : loading ? (
        <Text style={styles.info}>Cargando…</Text>
      ) : notificaciones.length === 0 ? (
        <EmptyState title="No tenés notificaciones" description="Acá vas a ver menciones, invitaciones y novedades." />
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, !item.leida && styles.rowUnread]}
              onPress={() => handleOpen(item)}
            >
              <View style={styles.rowIcon}>
                <Ionicons name={TYPE_ICON[item.tipo]} size={16} color={colors.primary} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.titulo}
                </Text>
                <Text style={styles.rowMessage} numberOfLines={2}>
                  {item.mensaje}
                </Text>
                <Text style={styles.rowMeta}>{formatRelativo(item.creadoAt)}</Text>
              </View>
              <Pressable onPress={() => handleEliminar(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.mutedForeground} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
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
  markAllLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  info: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  list: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  rowMessage: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  rowMeta: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    opacity: 0.7,
  },
  detail: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  detailTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
    flexShrink: 1,
  },
  detailMessage: {
    color: colors.foreground,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  detailMeta: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  detailActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  detailButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailButtonLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  detailCloseButton: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailCloseLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
})
