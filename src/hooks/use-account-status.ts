import { useEffect, useState } from 'react'

import { esBanActivo, obtenerMisSanciones, type Sancion } from '@/lib/moderation'

const CHECK_INTERVAL_MS = 60_000

export function useAccountStatus(userId: string | null): {
  sanciones: Sancion[]
  activeBan: Sancion | null
  loading: boolean
  marcarReconocida: (sancionId: string) => void
} {
  const [sanciones, setSanciones] = useState<Sancion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    let cancelado = false

    function verificar() {
      obtenerMisSanciones()
        .then((data) => {
          if (cancelado) return
          setSanciones(data)
        })
        .catch((err) => console.error('No se pudo verificar el estado de la cuenta', err))
        .finally(() => {
          if (!cancelado) setLoading(false)
        })
    }

    verificar()
    const interval = setInterval(verificar, CHECK_INTERVAL_MS)

    return () => {
      cancelado = true
      clearInterval(interval)
    }
  }, [userId])

  const activeBan = sanciones.find(esBanActivo) ?? null

  function marcarReconocida(sancionId: string) {
    setSanciones((prev) =>
      prev.map((s) => (s.id === sancionId ? { ...s, reconocidaAt: new Date().toISOString() } : s))
    )
  }

  return { sanciones, activeBan, loading: userId ? loading : false, marcarReconocida }
}
