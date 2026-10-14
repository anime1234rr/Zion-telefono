import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { RootStackParamList } from '@/navigation/types'
import { FilaAccion, Grupo, SettingsLayout } from '@/screens/settings/settings-ui'

export function AppSettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  return (
    <SettingsLayout titulo="Configuración de la app">
      <Grupo titulo="Ajustes">
        <FilaAccion icono="notifications-outline" titulo="Notificaciones" onPress={() => navigation.navigate('NotificationSettings')} />
        <FilaAccion icono="mic-outline" titulo="Voz y video" onPress={() => navigation.navigate('VoiceVideoSettings')} />
        <FilaAccion icono="accessibility-outline" titulo="Accesibilidad" onPress={() => navigation.navigate('AccessibilitySettings')} />
        <FilaAccion icono="globe-outline" titulo="Idioma y región" onPress={() => navigation.navigate('LanguageSettings')} />
        <FilaAccion icono="server-outline" titulo="Almacenamiento y datos" onPress={() => navigation.navigate('StorageSettings')} />
      </Grupo>
    </SettingsLayout>
  )
}
