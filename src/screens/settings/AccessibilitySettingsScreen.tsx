import { Linking, Text } from 'react-native'

import { setAppSetting, useAppSettings } from '@/lib/app-settings'
import { FilaAccion, FilaInterruptor, Grupo, SettingsLayout, settingsStyles } from '@/screens/settings/settings-ui'
import { Segmentado, useCambiarApariencia } from '@/screens/settings/apariencia-opciones'

export function AccessibilitySettingsScreen() {
  const ajustes = useAppSettings()
  const { pref, cambiar } = useCambiarApariencia()
  return (
    <SettingsLayout titulo="Accesibilidad">
      <Grupo titulo="Movimiento">
        <FilaInterruptor
          titulo="Reducir animaciones"
          descripcion="Quita las transiciones entre pantallas y pausa los fondos animados."
          valor={ajustes.reduceMotion}
          onChange={(v) => setAppSetting('reduceMotion', v)}
        />
      </Grupo>
      <Grupo titulo="Visión">
        <FilaInterruptor
          titulo="Alto contraste"
          descripcion="Refuerza los bordes y los textos secundarios para que se distingan mejor."
          valor={pref.altoContraste}
          onChange={(v) => cambiar('altoContraste', v)}
        />
        <FilaInterruptor
          titulo="Subrayar enlaces"
          descripcion="Marca con subrayado los textos que abren un enlace."
          valor={ajustes.subrayarEnlaces}
          onChange={(v) => setAppSetting('subrayarEnlaces', v)}
        />
        <FilaInterruptor
          titulo="Indicadores de estado con forma"
          descripcion="Además del color, usa formas distintas para conectado, ausente, no molestar y desconectado."
          valor={ajustes.indicadoresConForma}
          onChange={(v) => setAppSetting('indicadoresConForma', v)}
        />
      </Grupo>
      <Grupo titulo="Tamaño del texto">
        <Segmentado
          opciones={[
            { valor: 'chico', label: 'Chico' },
            { valor: 'normal', label: 'Normal' },
            { valor: 'grande', label: 'Grande' },
            { valor: 'muy-grande', label: 'Muy grande' },
          ]}
          valor={pref.fuente}
          onChange={(v) => cambiar('fuente', v)}
        />
        <FilaAccion
          icono="text-outline"
          titulo="Tamaño de letra del sistema"
          descripcion="Zion también respeta el tamaño de letra que elijas en los ajustes de accesibilidad del teléfono."
          onPress={() => Linking.openSettings()}
        />
      </Grupo>
      <Text style={settingsStyles.nota}>
        Zion es compatible con los lectores de pantalla del sistema (TalkBack y VoiceOver).
      </Text>
    </SettingsLayout>
  )
}
