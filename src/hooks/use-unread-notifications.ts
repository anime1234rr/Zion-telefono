import { useEffect, useState } from 'react'

import { listarNotificaciones, suscribirseANotificaciones } from '@/lib/notifications'

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
