import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '@/hooks/use-auth'
import { usePresence } from '@/hooks/use-presence'
import { useAuthDeepLinks } from '@/lib/auth-deep-links'
import { AuthScreen } from '@/screens/auth/AuthScreen'
import { ConfirmSignUpScreen } from '@/screens/auth/ConfirmSignUpScreen'
import { MagicLinkScreen } from '@/screens/auth/MagicLinkScreen'
import { ResetPasswordRequestScreen } from '@/screens/auth/ResetPasswordRequestScreen'
import { ResetPasswordConfirmScreen } from '@/screens/auth/ResetPasswordConfirmScreen'
import { InviteAcceptScreen } from '@/screens/auth/InviteAcceptScreen'
import { ReauthenticateScreen } from '@/screens/auth/ReauthenticateScreen'
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
import { SecurityScreen } from '@/screens/profile/SecurityScreen'
import { ChangeEmailScreen } from '@/screens/profile/ChangeEmailScreen'
import { VoiceChannelPlaceholderScreen } from '@/screens/placeholders/VoiceChannelPlaceholderScreen'
import { VoiceChannelScreen } from '@/screens/servers/VoiceChannelScreen'
import { ForumChannelScreen } from '@/screens/servers/ForumChannelScreen'
import { ThreadListScreen } from '@/screens/servers/ThreadListScreen'
import { ThreadChatScreen } from '@/screens/servers/ThreadChatScreen'
import { ServerModerationScreen } from '@/screens/servers/ServerModerationScreen'
import { ServerCommunityScreen } from '@/screens/servers/ServerCommunityScreen'
import { ServerOverviewScreen } from '@/screens/servers/ServerOverviewScreen'
import { ServerAppsScreen } from '@/screens/servers/ServerAppsScreen'
import { WebhooksScreen } from '@/screens/servers/WebhooksScreen'
import { RolesScreen } from '@/screens/servers/RolesScreen'
import { AuditLogScreen } from '@/screens/servers/AuditLogScreen'
import { ExpresionesScreen } from '@/screens/servers/ExpresionesScreen'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'

const Stack = createNativeStackNavigator<RootStackParamList>()

export function RootNavigator() {
  const { user, loading, pendingAuthAction } = useAuth()
  usePresence(user?.id ?? null)
  useAuthDeepLinks()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const showAuthStack = !user || pendingAuthAction !== null

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showAuthStack ? (
        <>
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="ConfirmSignUp" component={ConfirmSignUpScreen} />
          <Stack.Screen name="MagicLink" component={MagicLinkScreen} />
          <Stack.Screen name="ResetPasswordRequest" component={ResetPasswordRequestScreen} />
          <Stack.Screen name="ResetPasswordConfirm" component={ResetPasswordConfirmScreen} />
          <Stack.Screen name="InviteAccept" component={InviteAcceptScreen} />
        </>
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
          <Stack.Screen name="Security" component={SecurityScreen} />
          <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
          <Stack.Screen
            name="Reauthenticate"
            component={ReauthenticateScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="CreateOrJoinServer"
            component={CreateOrJoinServerScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="VoiceChannel" component={VoiceChannelScreen} />
          <Stack.Screen name="VoiceChannelPlaceholder" component={VoiceChannelPlaceholderScreen} />
          <Stack.Screen name="ServerOverview" component={ServerOverviewScreen} />
          <Stack.Screen name="ServerApps" component={ServerAppsScreen} />
          <Stack.Screen name="ForumChannel" component={ForumChannelScreen} />
          <Stack.Screen name="ThreadList" component={ThreadListScreen} />
          <Stack.Screen name="ThreadChat" component={ThreadChatScreen} />
          <Stack.Screen name="ServerModeration" component={ServerModerationScreen} />
          <Stack.Screen name="ServerCommunity" component={ServerCommunityScreen} />
          <Stack.Screen name="Webhooks" component={WebhooksScreen} />
          <Stack.Screen name="Roles" component={RolesScreen} />
          <Stack.Screen name="AuditLog" component={AuditLogScreen} />
          <Stack.Screen name="Expresiones" component={ExpresionesScreen} />
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
