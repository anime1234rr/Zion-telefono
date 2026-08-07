import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { ServerListItem } from '@/components/ServerListItem'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/hooks/use-auth'
import { listarServidores, suscribirseAServidores } from '@/lib/servers'
import type { ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

export function ServerListScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [servers, setServers] = useState<ServerItem[]>([])

  const cargar = useCallback(() => {
    listarServidores()
      .then(setServers)
      .catch((err) => console.error('No se pudieron cargar los servidores', err))
  }, [])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar])
  )

  useEffect(() => {
    if (!userId) return
    return suscribirseAServidores(userId, {
      onServidorNuevoOActualizado: (servidor) => {
        setServers((prev) => {
          const index = prev.findIndex((s) => s.id === servidor.id)
          if (index === -1) return [...prev, servidor]
          const next = [...prev]
          next[index] = servidor
          return next
        })
      },
      onServidorRemovido: (servidorId) => {
        setServers((prev) => prev.filter((s) => s.id !== servidorId))
      },
    })
  }, [userId])

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Servidores</Text>
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.navigate('CreateOrJoinServer')}
          hitSlop={8}
        >
          <Ionicons name="add" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {servers.length === 0 ? (
        <EmptyState
          title="Todavía no estás en ningún servidor"
          description="Creá uno nuevo o unite con un código de invitación."
        />
      ) : (
        <FlatList
          data={servers}
          keyExtractor={(item) => item.id}
          numColumns={4}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <View style={styles.cell}>
              <ServerListItem
                server={item}
                onPress={() => navigation.navigate('ServerChannels', { serverId: item.id })}
              />
              <Text style={styles.serverName} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
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
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  grid: {
    paddingHorizontal: spacing.md,
  },
  row: {
    justifyContent: 'flex-start',
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  serverName: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    maxWidth: 64,
    textAlign: 'center',
  },
})
