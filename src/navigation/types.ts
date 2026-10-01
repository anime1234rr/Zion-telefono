export type MainTabParamList = {
  Inicio: undefined
  Servidores: undefined
  Explorar: undefined
}

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  ServerChannels: { serverId: string }
  Channel: { serverId: string; channelId: string; channelName: string; highlightMessageId?: string }
  DMChat: { conversationId: string }
  Friends: undefined
  Profile: undefined
  Security: undefined
  Legal: undefined
  Notifications: undefined
  ServerMembers: { serverId: string }
  ServerSettings: { serverId: string }
  ServerModeration: { serverId: string }
  ServerCommunity: { serverId: string }
  ServerOverview: { serverId: string }
  ServerApps: { serverId: string }
  CreateOrJoinServer: undefined
  VoiceChannel: { channelId: string; channelName: string }
  VoiceChannelPlaceholder: { channelId: string; channelName: string }
  ForumChannel: { serverId: string; channelId: string; channelName: string }
  ThreadList: { serverId: string; channelId: string; channelName: string }
  ThreadChat: { serverId: string; threadId: string; threadName: string; locked?: boolean }
  Webhooks: { serverId: string }
  Roles: { serverId: string }
  AuditLog: { serverId: string }
  Expresiones: { serverId: string }
  ConfirmSignUp: { email: string }
  MagicLink: undefined
  ResetPasswordRequest: undefined
  ResetPasswordConfirm: undefined
  InviteAccept: undefined
  ChangeEmail: undefined
  Reauthenticate: { id: number; reason: string }
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
