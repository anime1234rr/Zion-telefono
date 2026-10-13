import { useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { uniqueId } from '@/lib/id'

interface MiembroConRolesRow {
  miembros_roles: { roles_servidor: { permisos: Record<string, boolean> | null } | null }[] | null
}

function unirPermisos(row: MiembroConRolesRow | null): Record<string, boolean> {
  const merged: Record<string, boolean> = {}
  for (const fila of row?.miembros_roles ?? []) {
    const permisos = fila.roles_servidor?.permisos
    if (!permisos) continue
    for (const [clave, valor] of Object.entries(permisos)) {
      if (valor) merged[clave] = true
    }
  }
  return merged
}

export function useServerPermissions(serverId: string, userId: string | undefined) {
  const [ownerId, setOwnerId] = useState<string | null>(null)
  const [permisos, setPermisos] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    let cancelado = false

    async function cargar() {
      const [servidor, miembro] = await Promise.all([
        supabase.from('servidores').select('propietario_id').eq('id', serverId).maybeSingle<{ propietario_id: string }>(),
        supabase
          .from('miembros_servidor')
          .select('miembros_roles(roles_servidor(permisos))')
          .eq('servidor_id', serverId)
          .eq('usuario_id', userId as string)
          .maybeSingle<MiembroConRolesRow>(),
      ])
      if (cancelado) return
      setOwnerId(servidor.data?.propietario_id ?? null)
      setPermisos(unirPermisos(miembro.data ?? null))
      setLoading(false)
    }

    cargar()

    const channel = supabase
      .channel(`permisos-propios-${serverId}-${userId}-${uniqueId()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'miembros_servidor', filter: `usuario_id=eq.${userId}` },
        () => cargar()
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'miembros_roles' }, () => cargar())
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'roles_servidor', filter: `servidor_id=eq.${serverId}` },
        () => cargar()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'servidores', filter: `id=eq.${serverId}` },
        () => cargar()
      )
      .subscribe()

    return () => {
      cancelado = true
      supabase.removeChannel(channel)
    }
  }, [serverId, userId])

  const isOwner = !!userId && ownerId === userId

  function hasPermission(permiso: string): boolean {
    if (isOwner) return true
    return Boolean(permisos.todo || permisos.admin || permisos.admin_servidor || permisos[permiso])
  }

  return { loading, isOwner, ownerId, hasPermission }
}
