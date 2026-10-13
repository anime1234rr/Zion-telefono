import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '@/hooks/use-auth'
import { usePresence } from '@/hooks/use-presence'
import { usePushNotifications } from '@/hooks/use-push-notifications'
import { aplicarFondo, cargarFondo, useAppBackground } from '@/lib/app-background'
import { useAppSettings } from '@/lib/app-settings'
import { suscribirseAMiPerfil } from '@/lib/presence'
import { useAccountStatus } from '@/hooks/use-account-status'
import { useSystemStatus } from '@/hooks/use-system-status'
import { AccountStatusScreen } from '@/screens/status/AccountStatusScreen'
import { MaintenanceScreen } from '@/screens/status/MaintenanceScreen'
import { SancionNoticeModal } from '@/screens/status/SancionNoticeModal'
import { useAuthDeepLinks } from '@/lib/auth-deep-links'
import { AuthScreen } from '@/screens/auth/AuthScreen'
import { ConfirmSignUpScreen } from '@/screens/auth/ConfirmSignUpScreen'
import { MagicLinkScreen } from '@/screens/auth/MagicLinkScreen'
import { ResetPasswordRequestScreen } from '@/screens/auth/ResetPasswordRequestScreen'
import { ResetPasswordConfirmScreen } from '@/screens/auth/ResetPasswordConfirmScreen'
import { InviteAcceptScreen } from '@/screens/auth/InviteAcceptScreen'
import { ReauthenticateScreen } from '@/screens/auth/ReauthenticateScreen'
import { MfaChallengeScreen } from '@/screens/auth/MfaChallengeScreen'
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
import { LegalScreen } from '@/screens/profile/LegalScreen'
import { ReportUserScreen } from '@/screens/profile/ReportUserScreen'
import { StaffPanelScreen } from '@/screens/staff/StaffPanelScreen'
import { AccountHistoryScreen } from '@/screens/profile/AccountHistoryScreen'
import { HelpScreen } from '@/screens/profile/HelpScreen'
import { SavedMessagesScreen } from '@/screens/profile/SavedMessagesScreen'
import { AppSettingsScreen } from '@/screens/settings/AppSettingsScreen'
import { NotificationSettingsScreen } from '@/screens/settings/NotificationSettingsScreen'
import { AppearanceSettingsScreen } from '@/screens/settings/AppearanceSettingsScreen'
import { VoiceVideoSettingsScreen } from '@/screens/settings/VoiceVideoSettingsScreen'
import { AccessibilitySettingsScreen } from '@/screens/settings/AccessibilitySettingsScreen'
import { LanguageSettingsScreen } from '@/screens/settings/LanguageSettingsScreen'
import { StorageSettingsScreen } from '@/screens/settings/StorageSettingsScreen'
import { StaffReportScreen } from '@/screens/staff/StaffReportScreen'
import { StaffUserScreen } from '@/screens/staff/StaffUserScreen'
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
  const { user, loading, pendingAuthAction, mfaRequired, signOut } = useAuth()
  const sesionLista = !!user && !mfaRequired && pendingAuthAction === null
  const { isMaintenance, bypass } = useSystemStatus(user?.id)
  const {
    activeBan,
    sanciones,
    loading: statusLoading,
    marcarReconocida,
  } = useAccountStatus(sesionLista ? (user?.id ?? null) : null)
  const advertenciaPendiente =
    sanciones.find((s) => s.tipo === 'advertencia' && s.activa && !s.reconocidaAt) ?? null
  usePresence(sesionLista && !activeBan && !isMaintenance ? (user?.id ?? null) : null)
  usePushNotifications(sesionLista && !activeBan ? (user?.id ?? null) : null)
  useAuthDeepLinks()
  const fondo = useAppBackground()
  const { reduceMotion } = useAppSettings()
  const fondoUserId = sesionLista ? (user?.id ?? null) : null

  useEffect(() => {
    if (!fondoUserId) {
      aplicarFondo(null)
      return
    }
    cargarFondo(fondoUserId).catch(() => {})
    return suscribirseAMiPerfil(fondoUserId, (row) => {
      aplicarFondo(
        row.fondo_url && (row.fondo_tipo === 'imagen' || row.fondo_tipo === 'video')
          ? { url: row.fondo_url, tipo: row.fondo_tipo }
          : null
      )
    })
  }, [fondoUserId])

  if (loading || (sesionLista && statusLoading)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const showAuthStack = !user || pendingAuthAction !== null

  if (sesionLista && isMaintenance && !bypass) {
    return <MaintenanceScreen />
  }

  if (sesionLista && activeBan) {
    return <AccountStatusScreen ban={activeBan} onSignOut={signOut} />
  }

  return (
    <>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: reduceMotion ? 'none' : 'default',
          contentStyle: fondo ? { backgroundColor: 'transparent' } : undefined,
        }}
      >
        {!showAuthStack && mfaRequired ? (
          <Stack.Screen name="MfaChallenge" component={MfaChallengeScreen} />
        ) : showAuthStack ? (
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
            <Stack.Screen name="Legal" component={LegalScreen} />
            <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
            <Stack.Screen
              name="Reauthenticate"
              component={ReauthenticateScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="AccountHistory" component={AccountHistoryScreen} />
            <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
            <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
            <Stack.Screen name="AppearanceSettings" component={AppearanceSettingsScreen} />
            <Stack.Screen name="VoiceVideoSettings" component={VoiceVideoSettingsScreen} />
            <Stack.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} />
            <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
            <Stack.Screen name="StorageSettings" component={StorageSettingsScreen} />
            <Stack.Screen name="SavedMessages" component={SavedMessagesScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="StaffPanel" component={StaffPanelScreen} />
            <Stack.Screen name="StaffReport" component={StaffReportScreen} />
            <Stack.Screen name="StaffUser" component={StaffUserScreen} />
            <Stack.Screen
              name="ReportUser"
              component={ReportUserScreen}
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
      {sesionLista && advertenciaPendiente ? (
        <SancionNoticeModal
          sancion={advertenciaPendiente}
          onAcknowledged={() => marcarReconocida(advertenciaPendiente.id)}
        />
      ) : null}
    </>
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
