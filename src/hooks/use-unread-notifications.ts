import { useEffect, useState } from 'react'

import {
  contarMencionesNoLeidas,
  listarNotificaciones,
  suscribirseANotificaciones,
} from '@/lib/notifications'

export function useUnreadNotificationsCount(userId: string | null): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }

    listarNotificaciones(userId)
      .then((data) => setCount(data.filter((n) => !n.leida).length))
      .catch(() => {})

    return suscribirseANotificaciones(userId, () => {
      setCount((prev) => prev + 1)
    })
  }, [userId])

  return count
}

export function useMentionCount(userId: string | null): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setCount(0)
      return
    }

    let cancelado = false
    function refrescar() {
      contarMencionesNoLeidas(userId as string)
        .then((r) => {
          if (!cancelado) setCount(r.total)
        })
        .catch(() => {})
    }

    refrescar()
    const intervalo = setInterval(refrescar, 40_000)
    const off = suscribirseANotificaciones(userId, refrescar)

    return () => {
      cancelado = true
      clearInterval(intervalo)
      off()
    }
  }, [userId])

  return count
}
