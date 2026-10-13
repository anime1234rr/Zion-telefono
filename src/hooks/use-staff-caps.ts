import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'

export interface StaffCaps {
  loading: boolean
  esAdmin: boolean
  esStaff: boolean
  canGestionarSanciones: boolean
  canVerHistorial: boolean
  canGestionarExplorar: boolean
}

interface StaffRoleEntry {
  tipo: string
  permisos: Record<string, boolean>
}

interface ObtenerMiStaffRow {
  es_admin: boolean
  roles: StaffRoleEntry[]
}

const DEFAULT_CAPS: StaffCaps = {
  loading: true,
  esAdmin: false,
  esStaff: false,
  canGestionarSanciones: false,
  canVerHistorial: false,
  canGestionarExplorar: false,
}

export function useStaffCaps(userId: string | undefined): StaffCaps {
  const [caps, setCaps] = useState<StaffCaps>(DEFAULT_CAPS)

  useEffect(() => {
    if (!userId) return

    let cancelado = false

    supabase
      .rpc('obtener_mi_staff')
      .single<ObtenerMiStaffRow>()
      .then(({ data, error }) => {
        if (cancelado) return
        if (error || !data) {
          setCaps({ ...DEFAULT_CAPS, loading: false })
          return
        }

        const roles = data.roles ?? []
        const tienePermiso = (clave: string) =>
          data.es_admin || roles.some((rol) => rol.permisos?.[clave] === true)

        setCaps({
          loading: false,
          esAdmin: data.es_admin,
          esStaff: data.es_admin || roles.length > 0,
          canGestionarSanciones: tienePermiso('gestionar_sanciones'),
          canVerHistorial: tienePermiso('ver_historial_sanciones'),
          canGestionarExplorar: tienePermiso('gestionar_explorar'),
        })
      })

    return () => {
      cancelado = true
    }
  }, [userId])

  return userId ? caps : { ...DEFAULT_CAPS, loading: false }
}
