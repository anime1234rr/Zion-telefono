import { Text } from 'react-native'

import { setAppSetting, useAppSettings } from '@/lib/app-settings'
import { FilaInterruptor, Grupo, SettingsLayout, settingsStyles } from '@/screens/settings/settings-ui'

export function VoiceVideoSettingsScreen() {
  const ajustes = useAppSettings()
  return (
    <SettingsLayout titulo="Voz y video" descripcion="Procesamiento del micrófono en los canales de voz.">
      <Grupo titulo="Micrófono">
        <FilaInterruptor
          titulo="Cancelación de eco"
          descripcion="Evita que los demás se escuchen a sí mismos cuando usás el altavoz."
          valor={ajustes.echoCancellation}
          onChange={(v) => setAppSetting('echoCancellation', v)}
        />
        <FilaInterruptor
          titulo="Supresión de ruido"
          descripcion="Reduce ruidos de fondo como ventiladores o teclados."
          valor={ajustes.noiseSuppression}
          onChange={(v) => setAppSetting('noiseSuppression', v)}
        />
        <FilaInterruptor
          titulo="Control automático de ganancia"
          descripcion="Ajusta el volumen de tu voz automáticamente."
          valor={ajustes.autoGainControl}
          onChange={(v) => setAppSetting('autoGainControl', v)}
        />
      </Grupo>
      <Text style={settingsStyles.nota}>Los cambios se aplican la próxima vez que entres a un canal de voz.</Text>
    </SettingsLayout>
  )
}
