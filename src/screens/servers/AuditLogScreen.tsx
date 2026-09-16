import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { listarRegistroAuditoria, type AuditLogAction, type AuditLogEntry } from '@/lib/audit-log'
import { formatTimestamp } from '@/lib/message-format'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'AuditLog'>

const ICONOS: Record<AuditLogAction, keyof typeof Ionicons.glyphMap> = {
  rol_creado: 'shield-outline',
  rol_actualizado: 'shield-outline',
  rol_eliminado: 'shield-outline',
  canal_creado: 'chatbubble-outline',
  canal_actualizado: 'chatbubble-outline',
  canal_eliminado: 'chatbubble-outline',
  miembro_rol_cambiado: 'swap-horizontal-outline',
  miembro_silenciado: 'volume-mute-outline',
  miembro_desilenciado: 'volume-medium-outline',
  miembro_expulsado: 'person-remove-outline',
  miembro_advertido: 'warning-outline',
  baneo_creado: 'ban-outline',
  baneo_actualizado: 'ban-outline',
  baneo_eliminado: 'ban-outline',
}

function nombreDe(actor: AuditLogEntry['actor']): string {
  return actor?.name ?? 'Alguien'
}

function describirEntrada(entry: AuditLogEntry): string {
  const actor = nombreDe(entry.actor)
  const objetivo = entry.objetivo?.name
  const d = entry.detalle

  switch (entry.accion) {
    case 'rol_creado':
      return `${actor} creó el rol "${d.nombre}".`
    case 'rol_actualizado':
      if (d.nombre_anterior !== d.nombre_nuevo) {
        return `${actor} renombró el rol "${d.nombre_anterior}" a "${d.nombre_nuevo}".`
      }
      if (d.permisos_cambiaron) {
        return `${actor} cambió los permisos del rol "${d.nombre_nuevo}".`
      }
      return `${actor} cambió el color del rol "${d.nombre_nuevo}".`
    case 'rol_eliminado':
      return `${actor} eliminó el rol "${d.nombre}".`
    case 'canal_creado':
      return `${actor} creó el canal "${d.nombre}".`
    case 'canal_actualizado':
      if (d.nombre_anterior !== d.nombre_nuevo) {
        return `${actor} renombró el canal "${d.nombre_anterior}" a "${d.nombre_nuevo}".`
      }
      if (d.tipo_anterior !== d.tipo_nuevo) {
        return `${actor} cambió el tipo del canal "${d.nombre_nuevo}".`
      }
      return `${actor} cambió la configuración del canal "${d.nombre_nuevo}".`
    case 'canal_eliminado':
      return `${actor} eliminó el canal "${d.nombre}".`
    case 'miembro_rol_cambiado':
      return `${actor} le asignó el rol "${d.rol_nuevo_nombre ?? 'sin rol'}" a ${objetivo ?? 'un miembro'}.`
    case 'miembro_silenciado':
      return `${actor} silenció a ${objetivo ?? 'un miembro'}${d.hasta ? ` hasta ${formatTimestamp(d.hasta as string)}` : ''}.`
    case 'miembro_desilenciado':
      return `${actor} le quitó el silencio a ${objetivo ?? 'un miembro'}.`
    case 'miembro_expulsado':
      return `${actor} expulsó a ${objetivo ?? 'un miembro'}.`
    case 'miembro_advertido':
      return `${actor} advirtió a ${objetivo ?? 'un miembro'}${d.razon ? `: "${d.razon}"` : '.'}`
    case 'baneo_creado':
      return `${actor} baneó a ${objetivo ?? 'un miembro'}${d.expira_at ? ` hasta ${formatTimestamp(d.expira_at as string)}` : ' de forma permanente'}${d.razon ? ` — "${d.razon}"` : ''}.`
    case 'baneo_actualizado':
      return `${actor} actualizó el baneo de ${objetivo ?? 'un miembro'}.`
    case 'baneo_eliminado':
      return `${actor} desbaneó a ${objetivo ?? 'un miembro'}.`
    default:
      return `${actor} realizó una acción.`
  }
}

export function AuditLogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    listarRegistroAuditoria(serverId)
      .then((data) => {
        if (cancelado) return
        setEntries(data)
        setHasMore(data.length >= 50)
      })
      .catch((err) => !cancelado && setError(getErrorMessage(err)))
      .finally(() => !cancelado && setLoading(false))
    return () => {
      cancelado = true
    }
  }, [serverId])

  const cargarMas = useCallback(async () => {
    if (loadingMore || !hasMore || entries.length === 0) return
    const ultima = entries[entries.length - 1]
    setLoadingMore(true)
    setError(null)
    try {
      const data = await listarRegistroAuditoria(serverId, ultima.creadoAt)
      setEntries((prev) => [...prev, ...data])
      setHasMore(data.length >= 50)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }, [serverId, entries, loadingMore, hasMore])

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Registro de auditoría</Text>
        <View style={{ width: 22 }} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={entries.length === 0 ? styles.flexGrow : undefined}
          ListEmptyComponent={
            <EmptyState
              title="Todavía no hay actividad"
              description="Los cambios de roles, canales y moderación van a aparecer acá."
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={cargarMas}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Ionicons name={ICONOS[item.accion] ?? 'shield-outline'} size={16} color={colors.mutedForeground} />
              </View>
              <View style={styles.info}>
                <Text style={styles.description}>{describirEntrada(item)}</Text>
                <Text style={styles.timestamp}>{formatTimestamp(item.creadoAt)}</Text>
              </View>
              {item.actor ? (
                <Avatar name={item.actor.name} url={item.actor.avatarUrl} size={28} />
              ) : null}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flexGrow: {
    flexGrow: 1,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  info: {
    flex: 1,
  },
  description: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  timestamp: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
})
