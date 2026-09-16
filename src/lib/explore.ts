import { supabase } from '@/lib/supabase'

export interface CommunityListing {
  id: string
  name: string
  iconUrl?: string
  bannerUrl?: string
  description?: string
  inviteCode?: string
  memberCount: number
  isMember: boolean
}

interface ExplorarComunidadesRow {
  id: string
  nombre: string
  icono_url: string | null
  banner_url: string | null
  descripcion: string | null
  codigo_invitacion: string | null
  cantidad_miembros: number | string
  ya_soy_miembro: boolean
}

function mapRow(row: ExplorarComunidadesRow): CommunityListing {
  return {
    id: row.id,
    name: row.nombre,
    iconUrl: row.icono_url ?? undefined,
    bannerUrl: row.banner_url ?? undefined,
    description: row.descripcion ?? undefined,
    inviteCode: row.codigo_invitacion ?? undefined,
    memberCount: Number(row.cantidad_miembros ?? 0),
    isMember: row.ya_soy_miembro === true,
  }
}

export async function explorarComunidades(
  query: string,
  opciones: { limite?: number; offset?: number } = {}
): Promise<CommunityListing[]> {
  const { data, error } = await supabase.rpc('explorar_comunidades', {
    p_query: query.trim() || null,
    p_limite: opciones.limite ?? 40,
    p_offset: opciones.offset ?? 0,
  })

  if (error) throw error
  return ((data ?? []) as ExplorarComunidadesRow[]).map(mapRow)
}
