import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { MemberActionsSheet, type PermisosMiembro } from '@/components/MemberActionsSheet'
import { UserBadge } from '@/components/UserBadge'
import { UserProfileModal } from '@/components/UserProfileModal'
import { showAppAlert } from '@/hooks/use-app-alert'
import { useAuth } from '@/hooks/use-auth'
import { useServerPermissions } from '@/hooks/use-server-permissions'
import {
  desbanearMiembro,
  displayMemberName,
  listarBaneados,
  listarMiembros,
  suscribirseAMiembrosDeServidor,
  type BannedMember,
  type ServerMember,
} from '@/lib/members'
import { obtenerOCrearConversacion } from '@/lib/dms'
import { formatFullDate } from '@/lib/internal/core-utils'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerMembers'>
type Pestana = 'miembros' | 'baneados'

export function ServerMembersScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params
  const { isOwner, ownerId, hasPermission } = useServerPermissions(serverId, user?.id)

  const [members, setMembers] = useState<ServerMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [accionesDe, setAccionesDe] = useState<ServerMember | null>(null)
  const [pestana, setPestana] = useState<Pestana>('miembros')
  const [baneados, setBaneados] = useState<BannedMember[] | null>(null)
  const [baneadosError, setBaneadosError] = useState<string | null>(null)

  const permisos: PermisosMiembro = {
    roles: hasPermission('gestionar_roles'),
    apodos: isOwner || hasPermission('gestionar_apodos'),
    silenciar: isOwner || hasPermission('silenciar_miembros'),
    expulsar: isOwner || hasPermission('expulsar_miembros'),
    banear: isOwner || hasPermission('banear_miembros'),
  }
  const puedeModerar = Object.values(permisos).some(Boolean)

  const cargar = useCallback(() => {
    listarMiembros(serverId)
      .then((data) => {
        setMembers(data)
        setError(null)
      })
      .catch((err) => {
        console.error('No se pudieron cargar los miembros', err)
        setError(getErrorMessage(err))
      })
      .finally(() => setLoading(false))
  }, [serverId])

  const cargarBaneados = useCallback(() => {
    listarBaneados(serverId)
      .then((data) => {
        setBaneados(data)
        setBaneadosError(null)
      })
      .catch((err) => setBaneadosError(getErrorMessage(err)))
  }, [serverId])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar])
  )

  useEffect(() => {
    return suscribirseAMiembrosDeServidor(serverId, () => {
      cargar()
      if (permisos.banear) cargarBaneados()
    })
  }, [serverId, cargar, cargarBaneados, permisos.banear])

  useEffect(() => {
    if (pestana === 'baneados' && permisos.banear) cargarBaneados()
  }, [pestana, permisos.banear, cargarBaneados])

  async function handleMessage(memberUserId: string) {
    const conversationId = await obtenerOCrearConversacion(memberUserId)
    navigation.navigate('DMChat', { conversationId })
  }

  function desbanear(baneado: BannedMember) {
    showAppAlert('Desbanear', `¿Quitar el baneo de ${baneado.user.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desbanear',
        onPress: async () => {
          try {
            await desbanearMiembro(serverId, baneado.userId)
            cargarBaneados()
          } catch (err) {
            showAppAlert('Error', getErrorMessage(err))
          }
        },
      },
    ])
  }

  function puedeActuarSobre(member: ServerMember): boolean {
    return puedeModerar && member.user.id !== user?.id && member.user.id !== ownerId
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Miembros — {members.length}</Text>
        <View style={{ width: 22 }} />
      </View>

      {permisos.banear ? (
        <View style={styles.tabs}>
          {(
            [
              ['miembros', 'Miembros'],
              ['baneados', 'Baneados'],
            ] as const
          ).map(([valor, label]) => (
            <Pressable
              key={valor}
              style={[styles.tab, pestana === valor && styles.tabActiva]}
              onPress={() => setPestana(valor)}
            >
              <Text style={[styles.tabTexto, pestana === valor && styles.tabTextoActivo]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {pestana === 'baneados' && permisos.banear ? (
        baneadosError ? (
          <EmptyState title="No se pudo cargar la lista de baneados" description={baneadosError} />
        ) : !baneados ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : baneados.length === 0 ? (
          <EmptyState title="No hay nadie baneado" />
        ) : (
          <FlatList
            data={baneados}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Avatar name={item.user.name} url={item.user.avatarUrl} size={40} />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.user.name}</Text>
                  <Text style={styles.role} numberOfLines={2}>
                    {item.reason || 'Sin razón'} ·{' '}
                    {item.expiresAt ? `hasta ${formatFullDate(item.expiresAt)}` : 'permanente'}
                  </Text>
                </View>
                <Pressable style={styles.desbanear} onPress={() => desbanear(item)}>
                  <Text style={styles.desbanearTexto}>Desbanear</Text>
                </Pressable>
              </View>
            )}
          />
        )
      ) : error ? (
        <EmptyState title="No se pudieron cargar los miembros" description={error} />
      ) : !loading && members.length === 0 ? (
        <EmptyState title="Todavía no hay miembros para mostrar" />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.membershipId}
          renderItem={({ item }) => {
            const silenciado = !!item.silencedUntil && new Date(item.silencedUntil).getTime() > Date.now()
            return (
              <Pressable
                style={styles.row}
                onPress={() => setProfileUserId(item.user.id)}
                onLongPress={puedeActuarSobre(item) ? () => setAccionesDe(item) : undefined}
              >
                <Avatar name={item.user.name} url={item.user.avatarUrl} status={item.user.status} size={40} />
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, item.roles[0]?.color ? { color: item.roles[0].color } : null]}>
                      {displayMemberName(item)}
                    </Text>
                    <UserBadge userId={item.user.id} size={13} />
                    {item.user.id === ownerId ? <Ionicons name="star" size={12} color={colors.idle} /> : null}
                    {silenciado ? <Ionicons name="volume-mute" size={12} color={colors.mutedForeground} /> : null}
                  </View>
                  {item.roles.length > 0 ? (
                    <Text style={styles.role}>{item.roles.map((r) => r.nombre).join(', ')}</Text>
                  ) : null}
                </View>
                {puedeActuarSobre(item) ? (
                  <Pressable onPress={() => setAccionesDe(item)} hitSlop={8}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </Pressable>
            )
          }}
        />
      )}

      <MemberActionsSheet
        member={accionesDe}
        serverId={serverId}
        permisos={permisos}
        onClose={() => setAccionesDe(null)}
        onVerPerfil={(id) => {
          setAccionesDe(null)
          setProfileUserId(id)
        }}
        onCambio={cargar}
      />

      <UserProfileModal
        userId={profileUserId}
        currentUserId={user?.id ?? ''}
        visible={profileUserId !== null}
        onClose={() => setProfileUserId(null)}
        onMessageUser={handleMessage}
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
  tabs: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  tabActiva: { backgroundColor: colors.background },
  tabTexto: { color: colors.mutedForeground, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextoActivo: { color: colors.foreground },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  info: {
    flex: 1,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  role: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  desbanear: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  desbanearTexto: { color: colors.foreground, fontSize: fontSize.xs, fontWeight: '600' },
})
