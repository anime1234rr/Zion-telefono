import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { FriendRow } from '@/components/FriendRow'
import { EmptyState } from '@/components/EmptyState'
import { UserProfileModal } from '@/components/UserProfileModal'
import { useAuth } from '@/hooks/use-auth'
import {
  aceptarSolicitudAmistad,
  buscarUsuarioPorNombre,
  enviarSolicitudAmistad,
  listarAmistades,
  rechazarSolicitudAmistad,
  suscribirseAAmistades,
} from '@/lib/friends'
import { obtenerOCrearConversacion } from '@/lib/dms'
import { getErrorMessage } from '@/lib/utils'
import type { ChatUser, Friend } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function FriendsScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [friends, setFriends] = useState<Friend[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChatUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

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

  async function handleSendRequest(userId: string) {
    try {
      await enviarSolicitudAmistad(userId)
      setQuery('')
      setResults([])
      cargar()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const pendientesRecibidas = friends.filter((f) => f.status === 'pendiente_recibida')
  const aceptadas = friends.filter((f) => f.status === 'aceptada')
  const enviadas = friends.filter((f) => f.status === 'pendiente_enviada')

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
          {results.map((result) => (
            <View key={result.id} style={styles.resultRow}>
              <Text style={styles.resultName}>{result.name}</Text>
              <Pressable style={styles.addButton} onPress={() => handleSendRequest(result.id)}>
                <Text style={styles.addButtonLabel}>Agregar</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <FlatList
        data={[...pendientesRecibidas, ...aceptadas, ...enviadas]}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <EmptyState title="Todavía no tenés amigos" description="Buscalos por su nombre de usuario." />
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
              ) : undefined
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
})
