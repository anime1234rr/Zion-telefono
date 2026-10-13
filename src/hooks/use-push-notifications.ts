import { useEffect } from 'react'
import * as Notifications from 'expo-notifications'

import { abrirEnlaceZion } from '@/lib/abrir-enlace'
import { actualizarInsignia, pushActivas, registrarPush } from '@/lib/push'
import { sincronizarPreferenciasNotificacion } from '@/lib/server-notification-prefs'
import { useUnreadNotificationsCount } from '@/hooks/use-unread-notifications'

function datosDeRespuesta(respuesta: Notifications.NotificationResponse | null) {
  const data = respuesta?.notification.request.content.data as
    | { enlace?: string | null; servidorId?: string | null }
    | undefined
  return data ?? null
}

export function usePushNotifications(userId: string | null) {
  const noLeidas = useUnreadNotificationsCount(userId)

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    sincronizarPreferenciasNotificacion().catch(() => {})

    pushActivas().then((activas) => {
      if (cancelado || !activas) return
      registrarPush(true).catch((err) => console.error('No se pudieron activar las notificaciones', err))
    })

    const tokenSub = Notifications.addPushTokenListener(() => {
      pushActivas().then((activas) => {
        if (activas) registrarPush(false).catch(() => {})
      })
    })

    const respuestaSub = Notifications.addNotificationResponseReceivedListener((respuesta) => {
      const data = datosDeRespuesta(respuesta)
      abrirEnlaceZion(data?.enlace, data?.servidorId).catch(() => {})
    })

    Notifications.getLastNotificationResponseAsync().then((respuesta) => {
      if (cancelado || !respuesta) return
      const data = datosDeRespuesta(respuesta)
      setTimeout(() => abrirEnlaceZion(data?.enlace, data?.servidorId).catch(() => {}), 400)
      Notifications.clearLastNotificationResponseAsync?.().catch(() => {})
    })

    return () => {
      cancelado = true
      tokenSub.remove()
      respuestaSub.remove()
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    actualizarInsignia(noLeidas)
  }, [userId, noLeidas])
}
