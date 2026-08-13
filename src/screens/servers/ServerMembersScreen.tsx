import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { UserProfileModal } from '@/components/UserProfileModal'
import { useAuth } from '@/hooks/use-auth'
import { displayMemberName, listarMiembros, suscribirseAMiembrosDeServidor, type ServerMember } from '@/lib/members'
import { obtenerOCrearConversacion } from '@/lib/dms'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerMembers'>

export function ServerMembersScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [members, setMembers] = useState<ServerMember[]>([])
  const [profileUserId, setProfileUserId] = useState<string | null>(null)

  const cargar = useCallback(() => {
    listarMiembros(serverId)
      .then(setMembers)
      .catch((err) => console.error('No se pudieron cargar los miembros', err))
  }, [serverId])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar])
  )

  useEffect(() => {
    return suscribirseAMiembrosDeServidor(serverId, cargar)
  }, [serverId, cargar])

  async function handleMessage(memberUserId: string) {
    const conversationId = await obtenerOCrearConversacion(memberUserId)
    navigation.navigate('DMChat', { conversationId })
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

      <FlatList
        data={members}
        keyExtractor={(item) => item.membershipId}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => setProfileUserId(item.user.id)}>
            <Avatar name={item.user.name} url={item.user.avatarUrl} status={item.user.status} size={40} />
            <View style={styles.info}>
              <Text style={[styles.name, item.role?.color ? { color: item.role.color } : null]}>
                {displayMemberName(item)}
              </Text>
              {item.role ? <Text style={styles.role}>{item.role.nombre}</Text> : null}
            </View>
          </Pressable>
        )}
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
  name: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  role: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
})
