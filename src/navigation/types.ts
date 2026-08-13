export type MainTabParamList = {
  Inicio: undefined
  Servidores: undefined
}

export type RootStackParamList = {
  Auth: undefined
  Main: undefined
  ServerChannels: { serverId: string }
  Channel: { serverId: string; channelId: string; channelName: string; highlightMessageId?: string }
  DMChat: { conversationId: string }
  Friends: undefined
  Profile: undefined
  Notifications: undefined
  ServerMembers: { serverId: string }
  ServerSettings: { serverId: string }
  CreateOrJoinServer: undefined
  VoiceChannelPlaceholder: { channelId: string; channelName: string }
  Webhooks: { serverId: string }
  Roles: { serverId: string }
  AuditLog: { serverId: string }
  Expresiones: { serverId: string }
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
