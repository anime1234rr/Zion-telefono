import { useEffect } from 'react'
import { AppState, type AppStateStatus } from 'react-native'

import { iniciarHeartbeat, marcarConectado, marcarDesconectadoPorCierre } from '@/lib/presence'

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return

    let detenerHeartbeat: (() => void) | undefined

    marcarConectado()
      .then(() => {
        detenerHeartbeat = iniciarHeartbeat()
      })
      .catch((err) => console.error('No se pudo marcar como conectado', err))

    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'background') {
        marcarDesconectadoPorCierre().catch((err) =>
          console.error('No se pudo marcar como desconectado', err)
        )
      } else if (nextState === 'active') {
        marcarConectado().catch((err) => console.error('No se pudo marcar como conectado', err))
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      detenerHeartbeat?.()
      subscription.remove()
    }
  }, [userId])
}
