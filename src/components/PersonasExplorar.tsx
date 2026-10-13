import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Avatar } from '@/components/Avatar'
import { UserProfileModal } from '@/components/UserProfileModal'
import { showAppAlert } from '@/hooks/use-app-alert'
import { useAuth } from '@/hooks/use-auth'
import { obtenerOCrearConversacion } from '@/lib/dms'
import { explorarPersonas, suscribirseAPersonas, type PersonaConocida } from '@/lib/explore'
import { estadoPublicoAStatus } from '@/lib/profiles'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Filtro = 'todas' | 'amigos' | 'servidores' | 'conectadas'

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todas', label: 'Todas' },
  { id: 'amigos', label: 'Amigos' },
  { id: 'servidores', label: 'Servidores en común' },
  { id: 'conectadas', label: 'Conectadas' },
]

export function PersonasExplorar({ query }: { query: string }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()
  const [personas, setPersonas] = useState<PersonaConocida[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [perfilId, setPerfilId] = useState<string | null>(null)
  const queryRef = useRef(query)

  useEffect(() => {
    queryRef.current = query
  }, [query])

  useEffect(() => {
    const recargar = () => {
      explorarPersonas(queryRef.current)
        .then(setPersonas)
        .catch(() => {})
    }
    const dejarDeEscuchar = suscribirseAPersonas({
      onPerfil: (perfil) =>
        setPersonas((prev) =>
          prev.some((p) => p.id === perfil.id)
            ? prev.map((p) =>
                p.id === perfil.id ? { ...p, status: estadoPublicoAStatus(perfil.estado, perfil.actualizado_at) } : p
              )
            : prev
        ),
      onRelaciones: recargar,
    })
    const intervalo = setInterval(recargar, 60_000)
    return () => {
      dejarDeEscuchar()
      clearInterval(intervalo)
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    const t = setTimeout(() => {
      setCargando(true)
      setError(false)
      explorarPersonas(query)
        .then((data) => !cancelado && setPersonas(data))
        .catch(() => !cancelado && setError(true))
        .finally(() => !cancelado && setCargando(false))
    }, 250)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [query])

  const visibles = useMemo(
    () =>
      personas.filter((p) => {
        if (filtro === 'amigos') return p.isFriend
        if (filtro === 'servidores') return p.mutualServers > 0
        if (filtro === 'conectadas') return p.status !== 'offline'
        return true
      }),
    [personas, filtro]
  )

  async function abrirConversacion(otroId: string) {
    try {
      const conversationId = await obtenerOCrearConversacion(otroId)
      navigation.navigate('DMChat', { conversationId })
    } catch (err) {
      showAppAlert('No se pudo abrir el chat', getErrorMessage(err))
    }
  }

  return (
    <View style={styles.flex}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {FILTROS.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.chip, filtro === f.id && styles.chipActive]}
            onPress={() => setFiltro(f.id)}
          >
            <Text style={[styles.chipText, filtro === f.id && styles.chipTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {cargando ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No se pudieron cargar las personas.</Text>
        </View>
      ) : visibles.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={30} color={colors.mutedForeground} />
          <Text style={styles.emptyTitle}>No hay nadie por acá</Text>
          <Text style={styles.emptyText}>
            Acá aparecen las personas con las que compartís un servidor, una amistad o una conversación.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => setPerfilId(item.id)}>
              <Avatar name={item.displayName} url={item.avatarUrl} size={44} status={item.status} />
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text style={styles.username} numberOfLines={1}>
                  @{item.username}
                </Text>
                <View style={styles.tags}>
                  {item.isFriend ? (
                    <View style={[styles.tag, styles.tagFriend]}>
                      <Text style={[styles.tagText, styles.tagFriendText]}>Amigo</Text>
                    </View>
                  ) : null}
                  {item.mutualServers > 0 ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText} numberOfLines={1}>
                        {item.mutualServers === 1
                          ? item.mutualServerNames[0] ?? '1 servidor en común'
                          : `${item.mutualServers} servidores en común`}
                      </Text>
                    </View>
                  ) : null}
                  {item.hasConversation ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Chat</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        />
      )}

      <UserProfileModal
        userId={perfilId}
        currentUserId={user?.id ?? ''}
        visible={perfilId !== null}
        onClose={() => setPerfilId(null)}
        onMessageUser={abrirConversacion}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  chipScroll: { flexGrow: 0, flexShrink: 0, marginTop: spacing.sm },
  chipRow: { gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: alfa(colors.primary, 0.12) },
  chipText: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '600' },
  chipTextActive: { color: colors.foreground },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '700' },
  emptyText: { color: colors.mutedForeground, fontSize: fontSize.sm, textAlign: 'center' },
  list: { padding: spacing.lg, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  name: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  username: { color: colors.mutedForeground, fontSize: fontSize.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  tag: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    maxWidth: 200,
  },
  tagText: { color: colors.mutedForeground, fontSize: 11, fontWeight: '600' },
  tagFriend: { backgroundColor: alfa(colors.online, 0.15) },
  tagFriendText: { color: colors.online },
})
