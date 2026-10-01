import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { FriendRow } from '@/components/FriendRow'
import { EmptyState } from '@/components/EmptyState'
import { UserProfileModal } from '@/components/UserProfileModal'
import { useAuth } from '@/hooks/use-auth'
import { showAppAlert } from '@/hooks/use-app-alert'
import { leerTexto, escribirTexto } from '@/lib/local-store'
import {
  aceptarSolicitudAmistad,
  bloquearUsuario,
  buscarUsuarioPorNombre,
  desbloquearUsuario,
  eliminarAmistad,
  enviarSolicitudAmistad,
  listarAmistades,
  rechazarSolicitudAmistad,
  suscribirseAAmistades,
} from '@/lib/friends'
import { obtenerOCrearConversacion } from '@/lib/dms'
import { getErrorMessage } from '@/lib/utils'
import type { ChatUser, Friend, FriendStatus } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Tab = 'online' | 'todos' | 'pendientes' | 'bloqueados'

const TABS: { id: Tab; label: string }[] = [
  { id: 'online', label: 'Online' },
  { id: 'todos', label: 'Todos' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'bloqueados', label: 'Bloqueados' },
]

const TAB_STORAGE_KEY = 'zion:inicio:tab'

function esTabValida(value: string | null): value is Tab {
  return value === 'online' || value === 'todos' || value === 'pendientes' || value === 'bloqueados'
}

export function FriendsScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [tab, setTabState] = useState<Tab>('online')
  const [friends, setFriends] = useState<Friend[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChatUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  useEffect(() => {
    leerTexto(TAB_STORAGE_KEY).then((value) => {
      if (esTabValida(value)) setTabState(value)
    })
  }, [])

  function setTab(next: Tab) {
    setTabState(next)
    void escribirTexto(TAB_STORAGE_KEY, next)
  }

  const cargar = useCallback(() => {
    if (!userId) return
    listarAmistades(userId)
      .then(setFriends)
      .catch((err) => console.error('No se pudieron cargar las amistades', err))
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar])
  )

  useEffect(() => {
    if (!userId) return
    return suscribirseAAmistades(userId, cargar)
  }, [userId, cargar])

  useEffect(() => {
    if (!userId) return
    const timeout = setTimeout(() => {
      if (!query.trim()) {
        setResults([])
        return
      }
      buscarUsuarioPorNombre(query, userId)
        .then(setResults)
        .catch((err) => setError(getErrorMessage(err)))
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, userId])

  async function handleOpenConversation(userId: string) {
    try {
      const conversationId = await obtenerOCrearConversacion(userId)
      navigation.navigate('DMChat', { conversationId })
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleSendRequest(targetUserId: string) {
    setError(null)
    try {
      await enviarSolicitudAmistad(targetUserId)
      cargar()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleAcceptFromSearch(amistadId: string) {
    setError(null)
    try {
      await aceptarSolicitudAmistad(amistadId)
      cargar()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function openFriendOptions(friend: Friend) {
    showAppAlert(friend.user.name, undefined, [
      {
        text: 'Eliminar amigo',
        style: 'destructive',
        onPress: () => {
          eliminarAmistad(friend.user.id).then(cargar).catch((err) => setError(getErrorMessage(err)))
        },
      },
      {
        text: 'Bloquear',
        style: 'destructive',
        onPress: () => {
          bloquearUsuario(friend.user.id).then(cargar).catch((err) => setError(getErrorMessage(err)))
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  const relacionPorUsuario = useMemo(() => {
    const mapa = new Map<string, { id: string; status: FriendStatus }>()
    for (const f of friends) mapa.set(f.user.id, { id: f.id, status: f.status })
    return mapa
  }, [friends])

  const filteredFriends = useMemo(() => {
    switch (tab) {
      case 'online':
        return friends.filter((f) => f.status === 'aceptada' && f.user.status !== 'offline')
      case 'todos':
        return friends.filter(
          (f) => f.status === 'aceptada' || f.status === 'pendiente_recibida' || f.status === 'pendiente_enviada'
        )
      case 'pendientes':
        return friends.filter((f) => f.status === 'pendiente_enviada' || f.status === 'pendiente_recibida')
      case 'bloqueados':
        return friends.filter((f) => f.status === 'bloqueada')
    }
  }, [friends, tab])

  const pendingCount = useMemo(
    () => friends.filter((f) => f.status === 'pendiente_recibida').length,
    [friends]
  )

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Amigos</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre de usuario"
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          autoCapitalize="none"
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {results.length > 0 ? (
        <View style={styles.resultsBox}>
          {results.map((result) => {
            const rel = relacionPorUsuario.get(result.id)
            return (
              <View key={result.id} style={styles.resultRow}>
                <Text style={styles.resultName}>{result.name}</Text>
                {rel?.status === 'aceptada' ? (
                  <Text style={styles.resultHint}>Amigos</Text>
                ) : rel?.status === 'pendiente_enviada' ? (
                  <Text style={styles.resultHint}>Solicitud enviada</Text>
                ) : rel?.status === 'bloqueada' ? (
                  <Text style={styles.resultHint}>Bloqueado</Text>
                ) : rel?.status === 'pendiente_recibida' ? (
                  <Pressable style={styles.addButton} onPress={() => handleAcceptFromSearch(rel.id)}>
                    <Text style={styles.addButtonLabel}>Aceptar</Text>
                  </Pressable>
                ) : (
                  <Pressable style={styles.addButton} onPress={() => handleSendRequest(result.id)}>
                    <Text style={styles.addButtonLabel}>Agregar</Text>
                  </Pressable>
                )}
              </View>
            )
          })}
        </View>
      ) : null}

      <View style={styles.tabs}>
        {TABS.map(({ id, label }) => (
          <Pressable key={id} style={[styles.tab, tab === id && styles.tabActive]} onPress={() => setTab(id)}>
            <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>{label}</Text>
            {id === 'pendientes' && pendingCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState
            title={
              tab === 'online'
                ? 'Nadie conectado ahora mismo'
                : tab === 'todos'
                  ? 'Todavía no tenés amigos'
                  : tab === 'pendientes'
                    ? 'No hay solicitudes pendientes'
                    : 'No bloqueaste a nadie'
            }
            description={tab === 'todos' ? 'Buscalos por su nombre de usuario.' : undefined}
          />
        }
        renderItem={({ item }) => (
          <FriendRow
            friend={item}
            onPress={item.status === 'aceptada' ? () => handleOpenConversation(item.user.id) : undefined}
            onPressAvatar={() => setProfileUserId(item.user.id)}
            rightSlot={
              item.status === 'pendiente_recibida' ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => aceptarSolicitudAmistad(item.id).then(cargar)}
                  >
                    <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />
                  </Pressable>
                  <Pressable
                    style={styles.rejectButton}
                    onPress={() => rechazarSolicitudAmistad(item.id).then(cargar)}
                  >
                    <Ionicons name="close" size={16} color={colors.foreground} />
                  </Pressable>
                </View>
              ) : item.status === 'pendiente_enviada' ? (
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => rechazarSolicitudAmistad(item.id).then(cargar)}
                >
                  <Text style={styles.cancelButtonLabel}>Cancelar</Text>
                </Pressable>
              ) : item.status === 'bloqueada' ? (
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => desbloquearUsuario(item.user.id).then(cargar)}
                >
                  <Text style={styles.cancelButtonLabel}>Desbloquear</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.moreButton} onPress={() => openFriendOptions(item)} hitSlop={8}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.mutedForeground} />
                </Pressable>
              )
            }
          />
        )}
      />

      <UserProfileModal
        userId={profileUserId}
        currentUserId={userId ?? ''}
        visible={profileUserId !== null}
        onClose={() => setProfileUserId(null)}
        onMessageUser={handleOpenConversation}
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
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  resultsBox: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  resultName: {
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  resultHint: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addButtonLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primaryForeground,
  },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  acceptButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.online,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  cancelButtonLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  moreButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
