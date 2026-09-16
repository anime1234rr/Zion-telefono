import { useEffect, useState } from 'react'

import { useAuth } from '@/hooks/use-auth'
import { obtenerPerfilEditable } from '@/lib/profiles'

let cache: { userId: string; username: string } | null = null

export function useCurrentUsername(): string | undefined {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [username, setUsername] = useState<string | undefined>(
    cache && cache.userId === userId ? cache.username : undefined
  )

  useEffect(() => {
    if (!userId) {
      setUsername(undefined)
      return
    }
    if (cache && cache.userId === userId) {
      setUsername(cache.username)
      return
    }
    let cancelado = false
    obtenerPerfilEditable(userId)
      .then((perfil) => {
        if (cancelado) return
        cache = { userId, username: perfil.nombreUsuario }
        setUsername(perfil.nombreUsuario)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [userId])

  return username
}
