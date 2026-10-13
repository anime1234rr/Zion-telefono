import { useEffect, useState } from 'react'

import { verificarEstadoSistema } from '@/lib/system-status'

const CHECK_INTERVAL_MS = 60_000

export function useSystemStatus(sessionKey?: string): { isMaintenance: boolean; bypass: boolean } {
  const [isMaintenance, setIsMaintenance] = useState(false)
  const [bypass, setBypass] = useState(false)

  useEffect(() => {
    let cancelado = false

    function verificar() {
      verificarEstadoSistema()
        .then((estado) => {
          if (cancelado) return
          setIsMaintenance(estado.isMaintenance)
          setBypass(estado.bypass)
        })
        .catch((err) => console.error('No se pudo verificar el estado del sistema', err))
    }

    verificar()
    const interval = setInterval(verificar, CHECK_INTERVAL_MS)

    return () => {
      cancelado = true
      clearInterval(interval)
    }
  }, [sessionKey])

  return { isMaintenance, bypass }
}
