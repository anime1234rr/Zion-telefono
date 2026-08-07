import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '@/hooks/use-auth'
import { usePresence } from '@/hooks/use-presence'
import { AuthScreen } from '@/screens/auth/AuthScreen'
import { MainTabs } from '@/navigation/MainTabs'
import { FriendsScreen } from '@/screens/home/FriendsScreen'
import { DMChatScreen } from '@/screens/home/DMChatScreen'
import { NotificationsScreen } from '@/screens/home/NotificationsScreen'
import { ServerChannelsScreen } from '@/screens/servers/ServerChannelsScreen'
import { ChannelChatScreen } from '@/screens/servers/ChannelChatScreen'
import { CreateOrJoinServerScreen } from '@/screens/servers/CreateOrJoinServerScreen'
import { ServerMembersScreen } from '@/screens/servers/ServerMembersScreen'
import { ServerSettingsScreen } from '@/screens/servers/ServerSettingsScreen'
import { ProfileScreen } from '@/screens/profile/ProfileScreen'
import { VoiceChannelPlaceholderScreen } from '@/screens/placeholders/VoiceChannelPlaceholderScreen'
import { WebhooksPlaceholderScreen } from '@/screens/placeholders/WebhooksPlaceholderScreen'
import { RolesPlaceholderScreen } from '@/screens/placeholders/RolesPlaceholderScreen'
import { AuditLogPlaceholderScreen } from '@/screens/placeholders/AuditLogPlaceholderScreen'
import { ExpresionesPlaceholderScreen } from '@/screens/placeholders/ExpresionesPlaceholderScreen'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { user, loading } = useAuth()
  usePresence(user?.id ?? null)

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Friends" component={FriendsScreen} />
          <Stack.Screen name="DMChat" component={DMChatScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ServerChannels" component={ServerChannelsScreen} />
          <Stack.Screen name="Channel" component={ChannelChatScreen} />
          <Stack.Screen name="ServerMembers" component={ServerMembersScreen} />
          <Stack.Screen name="ServerSettings" component={ServerSettingsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen
            name="CreateOrJoinServer"
            component={CreateOrJoinServerScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="VoiceChannelPlaceholder" component={VoiceChannelPlaceholderScreen} />
          <Stack.Screen name="WebhooksPlaceholder" component={WebhooksPlaceholderScreen} />
          <Stack.Screen name="RolesPlaceholder" component={RolesPlaceholderScreen} />
          <Stack.Screen name="AuditLogPlaceholder" component={AuditLogPlaceholderScreen} />
          <Stack.Screen name="ExpresionesPlaceholder" component={ExpresionesPlaceholderScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
})
