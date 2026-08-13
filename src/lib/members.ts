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

export function suscribirseARolesDeServidor(servidorId: string, onCambio: () => void) {
  const channel = supabase
    .channel(`roles-servidor-${servidorId}-${uniqueId()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'roles_servidor',
        filter: `servidor_id=eq.${servidorId}`,
      },
      () => onCambio()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function listarRolesDeServidor(servidorId: string): Promise<ServerRole[]> {
  const { data, error } = await supabase
    .from('roles_servidor')
    .select('*')
    .eq('servidor_id', servidorId)
    .order('posicion', { ascending: true })
    .order('creado_at', { ascending: true })
    .returns<RolRow[]>()

  if (error) throw error
  return (data ?? []).map(mapRol)
}

export const CATEGORIAS_PERMISOS = [
  { id: 'servidor', label: 'Gestión del servidor', icon: '🛡️' },
  { id: 'canales', label: 'Canales y estructura', icon: '🛠️' },
  { id: 'miembros', label: 'Miembros y roles', icon: '👥' },
  { id: 'mensajes', label: 'Mensajes', icon: '💬' },
  { id: 'voz', label: 'Voz', icon: '🎙️' },
] as const

export const PERMISOS_CONOCIDOS = [
  { key: 'admin', label: 'Administrador del servidor (todos los permisos)', categoria: 'servidor' },
  { key: 'gestionar_servidor', label: 'Editar nombre e ícono del servidor', categoria: 'servidor' },
  { key: 'gestionar_invitaciones', label: 'Crear y revocar invitaciones', categoria: 'servidor' },
  { key: 'ver_registros', label: 'Ver registro de auditoría', categoria: 'servidor' },
  { key: 'gestionar_webhooks', label: 'Configurar apps y webhooks', categoria: 'servidor' },
  { key: 'gestionar_canales', label: 'Crear canales', categoria: 'canales' },
  { key: 'gestionar_roles', label: 'Crear y asignar roles', categoria: 'miembros' },
  { key: 'expulsar_miembros', label: 'Expulsar miembros', categoria: 'miembros' },
  { key: 'banear_miembros', label: 'Banear miembros', categoria: 'miembros' },
  { key: 'gestionar_apodos', label: 'Cambiar apodos de otros miembros', categoria: 'miembros' },
  { key: 'silenciar_miembros', label: 'Silenciar miembros (timeout)', categoria: 'miembros' },
  { key: 'advertir_miembros', label: 'Advertir miembros', categoria: 'miembros' },
  { key: 'enviar_mensajes', label: 'Enviar mensajes', categoria: 'mensajes' },
  { key: 'mencionar_todos', label: 'Mencionar a @todos y @aqui', categoria: 'mensajes' },
  { key: 'borrar_mensajes_ajenos', label: 'Borrar mensajes de otros', categoria: 'mensajes' },
  { key: 'fijar_mensajes', label: 'Fijar y desfijar mensajes', categoria: 'mensajes' },
  { key: 'conectar_voz', label: 'Conectarse a canales de voz', categoria: 'voz' },
  { key: 'transmitir_voz', label: 'Hablar en canales de voz', categoria: 'voz' },
] as const

export interface RolePreset {
  id: string
  nombre: string
  color: string
  permisos: Record<string, boolean>
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'moderador',
    nombre: 'Moderador',
    color: '#3b82f6',
    permisos: {
      gestionar_canales: true,
      gestionar_roles: true,
      expulsar_miembros: true,
      gestionar_apodos: true,
      silenciar_miembros: true,
      borrar_mensajes_ajenos: true,
      fijar_mensajes: true,
      mencionar_todos: true,
    },
  },
  {
    id: 'administrador',
    nombre: 'Administrador',
    color: '#ef4444',
    permisos: { admin: true },
  },
]

export async function crearRol(
  servidorId: string,
  nombre: string,
  color: string,
  permisos: Record<string, boolean>,
  posicion: number
): Promise<ServerRole> {
  const { data, error } = await supabase
    .from('roles_servidor')
    .insert({ servidor_id: servidorId, nombre: nombre.trim(), color, permisos, posicion })
    .select('*')
    .single<RolRow>()

  if (error) throw error
  return mapRol(data)
}

export async function reordenarRoles(roles: { id: string; posicion: number }[]): Promise<void> {
  const { error } = await Promise.all(
    roles.map((role) => supabase.from('roles_servidor').update({ posicion: role.posicion }).eq('id', role.id))
  ).then((results) => {
    const failed = results.find((r) => r.error)
    return { error: failed?.error ?? null }
  })

  if (error) throw error
}

export async function actualizarRol(
  rolId: string,
  cambios: { nombre?: string; color?: string; permisos?: Record<string, boolean> }
): Promise<ServerRole> {
  const patch: Record<string, unknown> = {}
  if (cambios.nombre !== undefined) patch.nombre = cambios.nombre.trim()
  if (cambios.color !== undefined) patch.color = cambios.color
  if (cambios.permisos !== undefined) patch.permisos = cambios.permisos

  const { data, error } = await supabase
    .from('roles_servidor')
    .update(patch)
    .eq('id', rolId)
    .select('*')
    .single<RolRow>()

  if (error) throw error
  return mapRol(data)
}

export async function eliminarRol(rolId: string): Promise<void> {
  const { error } = await supabase.from('roles_servidor').delete().eq('id', rolId)
  if (error) throw error
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
