import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { ConversationRow } from '@/components/ConversationRow'
import { EmptyState } from '@/components/EmptyState'
import { NotificationBellButton } from '@/components/NotificationBellButton'
import { useAuth } from '@/hooks/use-auth'
import { listarConversaciones, suscribirseAConversaciones } from '@/lib/dms'
import type { DMConversation } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

export function InicioScreen() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [conversations, setConversations] = useState<DMConversation[]>([])

  const cargar = useCallback(() => {
    if (!userId) return
    listarConversaciones(userId)
      .then(setConversations)
      .catch((err) => console.error('No se pudieron cargar las conversaciones', err))
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      cargar()
    }, [cargar])
  )

  useEffect(() => {
    if (!userId) return
    return suscribirseAConversaciones(userId, cargar)
  }, [userId, cargar])

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Mensajes</Text>
        <View style={styles.headerActions}>
          <NotificationBellButton style={styles.headerButton} />
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.navigate('Friends')}
            hitSlop={8}
          >
            <Ionicons name="people-outline" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile')}
            hitSlop={8}
          >
            <Ionicons name="person-circle-outline" size={20} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {conversations.length === 0 ? (
        <EmptyState
          title="No tenés conversaciones"
          description="Andá a Amigos para empezar a chatear con alguien."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => navigation.navigate('DMChat', { conversationId: item.id })}
            />
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
})
