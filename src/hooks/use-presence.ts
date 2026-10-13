import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import {
  iniciarHeartbeat,
  iniciarPresenciaDispositivo,
  marcarConectado,
  marcarDesconectadoPorCierre,
  suscribirseAMiPerfil,
} from '@/lib/presence'

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return

    let detenerHeartbeat: (() => void) | undefined
    const dispositivo = iniciarPresenciaDispositivo(userId)

    function conectar() {
      marcarConectado().catch((err) => console.error('No se pudo marcar como conectado', err))
    }

    marcarConectado()
      .then(() => {
        detenerHeartbeat = iniciarHeartbeat()
      })
      .catch((err) => console.error('No se pudo marcar como conectado', err))

    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'background') {
        dispositivo.pausar()
        if (dispositivo.hayOtrosDispositivos()) return
        marcarDesconectadoPorCierre().catch((err) =>
          console.error('No se pudo marcar como desconectado', err)
        )
      } else if (nextState === 'active') {
        dispositivo.reanudar()
        conectar()
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    const dejarDeEscuchar = suscribirseAMiPerfil(userId, (row) => {
      if (row.estado === 'desconectado_cierre' && AppState.currentState === 'active') conectar()
    })

    return () => {
      detenerHeartbeat?.()
      subscription.remove()
      dejarDeEscuchar()
      dispositivo.detener()
    }
  }, [userId])
}
