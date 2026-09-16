import type { ComponentType } from 'react'
import { useRoute } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { PlaceholderScreen } from '@/components/PlaceholderScreen'
import type { RootStackParamList } from '@/navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceChannel'>

type VoiceRoomProps = { channelId: string; channelName: string }

let VoiceRoomInner: ComponentType<VoiceRoomProps> | null = null
try {
  require('react-native-webrtc')
  VoiceRoomInner = (require('@/screens/servers/VoiceRoomInner') as {
    VoiceRoomInner: ComponentType<VoiceRoomProps>
  }).VoiceRoomInner
} catch {
  VoiceRoomInner = null
}

export function VoiceChannelScreen() {
  const route = useRoute<Props['route']>()
  const { channelId, channelName } = route.params

  if (!VoiceRoomInner) {
    return (
      <PlaceholderScreen
        title={channelName}
        icon="volume-medium-outline"
        description="Los canales de voz necesitan la app instalada como build de desarrollo o de producción. En Expo Go la voz no está disponible."
      />
    )
  }

  return <VoiceRoomInner channelId={channelId} channelName={channelName} />
}
