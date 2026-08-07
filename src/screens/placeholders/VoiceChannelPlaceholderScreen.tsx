import { useRoute } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { PlaceholderScreen } from '@/components/PlaceholderScreen'
import type { RootStackParamList } from '@/navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceChannelPlaceholder'>

export function VoiceChannelPlaceholderScreen() {
  const route = useRoute<Props['route']>()
  return (
    <PlaceholderScreen
      title={route.params.channelName}
      icon="volume-medium-outline"
      description="La voz y el video por canal todavía no están disponibles en la app móvil de Zion. Vas a poder unirte a esta sala desde acá en una próxima actualización."
    />
  )
}
