import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { useAuth } from '@/hooks/use-auth'
import { useUnreadNotificationsCount } from '@/hooks/use-unread-notifications'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'

export function NotificationBellButton({ size = 20, style }: { size?: number; style?: ViewStyle }) {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const unreadCount = useUnreadNotificationsCount(user?.id ?? null)

  return (
    <Pressable
      onPress={() => navigation.navigate('Notifications')}
      hitSlop={8}
      style={[styles.wrapper, style]}
    >
      <Ionicons name="notifications-outline" size={size} color={colors.foreground} />
      {unreadCount > 0 ? <View style={styles.dot} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  dot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
})
