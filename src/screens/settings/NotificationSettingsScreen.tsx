import { useCallback, useState } from 'react'
import { Linking, Text } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import { showAppAlert } from '@/hooks/use-app-alert'
import {
  cambiarPushActivas,
  enviarNotificacionDePrueba,
  estadoPermisoPush,
  pushActivas,
  type EstadoPermisoPush,
} from '@/lib/push'
import { getErrorMessage } from '@/lib/utils'
import { FilaAccion, FilaInterruptor, Grupo, SettingsLayout, settingsStyles } from '@/screens/settings/settings-ui'

const TEXTO_PERMISO: Record<EstadoPermisoPush, string> = {
  concedido: 'Permitidas',
  denegado: 'Bloqueadas en el sistema',
  'sin-preguntar': 'Sin permiso todavía',
  'no-disponible': 'No disponibles en este dispositivo',
}

export function NotificationSettingsScreen() {
  const [activas, setActivas] = useState(true)
  const [permiso, setPermiso] = useState<EstadoPermisoPush>('sin-preguntar')
  const [ocupado, setOcupado] = useState(false)

  useFocusEffect(
    useCallback(() => {
      pushActivas().then(setActivas)
      estadoPermisoPush().then(setPermiso)
    }, [])
  )

  async function cambiar(valor: boolean) {
    setOcupado(true)
    setActivas(valor)
    try {
      const estado = await cambiarPushActivas(valor)
      setPermiso(estado)
      if (valor && estado === 'denegado') {
        showAppAlert(
          'Notificaciones bloqueadas',
          'Android tiene bloqueadas las notificaciones de Zion. Activalas desde los ajustes del sistema.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
          ]
        )
      }
    } catch (err) {
      showAppAlert('No se pudo cambiar', getErrorMessage(err))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <SettingsLayout
      titulo="Notificaciones"
      descripcion="Recibí avisos en el teléfono aunque Zion esté cerrado: menciones, mensajes directos, solicitudes de amistad y avisos del sistema."
    >
      <Grupo titulo="Este dispositivo">
        <FilaInterruptor
          titulo="Notificaciones push"
          descripcion={TEXTO_PERMISO[permiso]}
          valor={activas && permiso !== 'denegado'}
          onChange={cambiar}
          deshabilitado={ocupado || permiso === 'no-disponible'}
        />
        <FilaAccion icono="settings-outline" titulo="Ajustes del sistema" descripcion="Sonido, vibración y categorías." onPress={() => Linking.openSettings()} />
        <FilaAccion
          icono="paper-plane-outline"
          titulo="Enviar notificación de prueba"
          onPress={() => enviarNotificacionDePrueba().catch((err) => showAppAlert('Error', getErrorMessage(err)))}
        />
      </Grupo>

      <Grupo titulo="Qué te avisamos">
        <FilaAccion icono="at-outline" titulo="Menciones" descripcion="Cuando alguien escribe @tu_usuario, @todos o @aquí." />
        <FilaAccion icono="chatbubble-outline" titulo="Mensajes directos" descripcion="Cada mensaje nuevo en tus conversaciones." />
        <FilaAccion icono="person-add-outline" titulo="Solicitudes de amistad" />
        <FilaAccion icono="information-circle-outline" titulo="Avisos de Zion y de tus servidores" />
      </Grupo>

      <Text style={settingsStyles.nota}>
        Para silenciar un servidor o recibir solo menciones, mantené apretado el servidor en la lista y elegí sus
        notificaciones. Esas preferencias se aplican también a las notificaciones push y se sincronizan con el escritorio.
      </Text>
    </SettingsLayout>
  )
}
