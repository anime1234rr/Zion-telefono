import { supabase } from '@/lib/supabase'
import { uniqueId } from '@/lib/id'
import { mapPerfilToChatUser, type PerfilRow } from '@/lib/profiles'
import type { ChatUser } from '@/lib/types'

export interface ServerRole {
  id: string
  nombre: string
  color: string | null
  posicion: number
  esRolBase: boolean
  permisos: Record<string, boolean>
}

export interface ServerMember {
  membershipId: string
  user: ChatUser
  role: ServerRole | null
  joinedAt: string
  silencedUntil: string | null
  nickname: string | null
}

export function displayMemberName(member: ServerMember): string {
  return member.nickname?.trim() || member.user.name
}

export function suscribirseAMiembrosDeServidor(
  servidorId: string,
  onCambio: () => void
) {
  const channel = supabase
    .channel(`miembros-servidor-${servidorId}-${uniqueId()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'miembros_servidor',
        filter: `servidor_id=eq.${servidorId}`,
      },
      () => onCambio()
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'perfiles' },
      () => onCambio()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

interface RolRow {
  id: string
  nombre: string
  color: string | null
  posicion: number
  es_rol_base: boolean
  permisos: Record<string, boolean>
}

interface MiembroRow {
  id: string
  usuario_id: string
  unido_at: string
  silenciado_hasta: string | null
  apodo: string | null
  perfiles: PerfilRow | null
  roles_servidor: RolRow | null
}

function mapRol(row: RolRow): ServerRole {
  return {
    id: row.id,
    nombre: row.nombre,
    color: row.color,
    posicion: row.posicion,
    esRolBase: row.es_rol_base,
    permisos: row.permisos ?? {},
  }
}

export async function listarMiembros(servidorId: string): Promise<ServerMember[]> {
  const { data, error } = await supabase
    .from('miembros_servidor')
    .select('id, usuario_id, unido_at, silenciado_hasta, apodo, perfiles(*), roles_servidor(*)')
    .eq('servidor_id', servidorId)
    .order('unido_at', { ascending: true })
    .returns<MiembroRow[]>()

  if (error) throw error
  return (data ?? []).map((row) => ({
    membershipId: row.id,
    user: row.perfiles
      ? mapPerfilToChatUser(row.perfiles)
      : { id: row.usuario_id, name: 'Usuario', status: 'offline' as const },
    role: row.roles_servidor ? mapRol(row.roles_servidor) : null,
    joinedAt: row.unido_at,
    silencedUntil: row.silenciado_hasta,
    nickname: row.apodo,
  }))
}
