import { supabase } from '@/lib/supabase'
import { uniqueId } from '@/lib/id'
import { estadoPublicoAStatus } from '@/lib/profiles'
import type { UserStatus } from '@/lib/types'

export interface CommunityListing {
  id: string
  name: string
  iconUrl?: string
  bannerUrl?: string
  description?: string
  inviteCode?: string
  memberCount: number
  isMember: boolean
  featured: boolean
  tags: string[]
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
  destacado_por_staff: boolean | null
  etiquetas: string[] | null
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
    featured: row.destacado_por_staff === true,
    tags: row.etiquetas ?? [],
  }
}

export async function explorarComunidades(
  query: string,
  opciones: { etiqueta?: string | null; limite?: number; offset?: number } = {}
): Promise<CommunityListing[]> {
  const { data, error } = await supabase.rpc('explorar_comunidades', {
    p_query: query.trim() || null,
    p_etiqueta: opciones.etiqueta?.trim() || null,
    p_limite: opciones.limite ?? 40,
    p_offset: opciones.offset ?? 0,
  })

  if (error) throw error
  return ((data ?? []) as ExplorarComunidadesRow[]).map(mapRow)
}

export type PeriodoDestacado = 'dia' | 'semana' | 'mes' | 'anio'

export async function explorarComunidadesDestacadas(
  periodo: PeriodoDestacado,
  limite = 10
): Promise<CommunityListing[]> {
  const { data, error } = await supabase.rpc('explorar_comunidades_destacadas', {
    p_periodo: periodo,
    p_limite: limite,
  })

  if (error) throw error
  return ((data ?? []) as ExplorarComunidadesRow[]).map(mapRow)
}

export interface EtiquetaPopular {
  id: string
  nombre: string
  cantidadServidores: number
}

export async function listarEtiquetasPopulares(limite = 30): Promise<EtiquetaPopular[]> {
  const { data, error } = await supabase.rpc('listar_etiquetas_populares', { p_limite: limite })
  if (error) throw error
  return ((data ?? []) as { id: string; nombre: string; cantidad_servidores: number | string }[]).map(
    (row) => ({
      id: row.id,
      nombre: row.nombre,
      cantidadServidores: Number(row.cantidad_servidores ?? 0),
    })
  )
}

export async function asignarEtiquetaServidor(servidorId: string, nombre: string): Promise<void> {
  const { error } = await supabase.rpc('asignar_etiqueta_servidor', {
    p_servidor_id: servidorId,
    p_nombre: nombre,
  })
  if (error) throw error
}

export async function quitarEtiquetaServidor(servidorId: string, etiquetaId: string): Promise<void> {
  const { error } = await supabase.rpc('quitar_etiqueta_servidor', {
    p_servidor_id: servidorId,
    p_etiqueta_id: etiquetaId,
  })
  if (error) throw error
}

export async function listarEtiquetasDeServidor(servidorId: string): Promise<EtiquetaPopular[]> {
  const { data, error } = await supabase
    .from('etiquetas_servidor')
    .select('etiquetas(id, nombre)')
    .eq('servidor_id', servidorId)
    .returns<{ etiquetas: { id: string; nombre: string } | null }[]>()

  if (error) throw error
  return (data ?? [])
    .map((row) => row.etiquetas)
    .filter((e): e is { id: string; nombre: string } => e !== null)
    .map((e) => ({ id: e.id, nombre: e.nombre, cantidadServidores: 0 }))
}

export interface PersonaConocida {
  id: string
  username: string
  displayName: string
  avatarUrl?: string
  bio?: string
  status: UserStatus
  isFriend: boolean
  mutualServers: number
  mutualServerNames: string[]
  hasConversation: boolean
}

interface ExplorarPersonasRow {
  id: string
  nombre_usuario: string
  nombre_completo: string | null
  avatar_url: string | null
  biografia: string | null
  estado: string
  actualizado_at: string
  es_amigo: boolean
  servidores_en_comun: number | string
  servidores_muestra: string[] | null
  tiene_conversacion: boolean
}

export async function explorarPersonas(query: string): Promise<PersonaConocida[]> {
  const { data, error } = await supabase.rpc('explorar_personas', {
    p_query: query.trim() || null,
    p_limite: 100,
  })

  if (error) throw error
  return ((data ?? []) as ExplorarPersonasRow[]).map((row) => ({
    id: row.id,
    username: row.nombre_usuario,
    displayName: row.nombre_completo?.trim() || row.nombre_usuario,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.biografia?.trim() || undefined,
    status: estadoPublicoAStatus(row.estado, row.actualizado_at),
    isFriend: row.es_amigo === true,
    mutualServers: Number(row.servidores_en_comun ?? 0),
    mutualServerNames: row.servidores_muestra ?? [],
    hasConversation: row.tiene_conversacion === true,
  }))
}

export function suscribirseAPersonas(handlers: {
  onPerfil: (perfil: { id: string; estado: string; actualizado_at: string }) => void
  onRelaciones: () => void
}): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  const recargar = () => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(handlers.onRelaciones, 400)
  }

  const channel = supabase
    .channel(`explorar-personas-${uniqueId()}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'perfiles' }, (payload) =>
      handlers.onPerfil(payload.new as { id: string; estado: string; actualizado_at: string })
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'amistades' }, recargar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'miembros_servidor' }, recargar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'conversaciones_directas' }, recargar)
    .subscribe()

  return () => {
    if (timer) clearTimeout(timer)
    supabase.removeChannel(channel)
  }
}
