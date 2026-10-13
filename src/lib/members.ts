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
  roles: ServerRole[]
  joinedAt: string
  silencedUntil: string | null
  nickname: string | null
}

function ordenarRoles(roles: ServerRole[]): ServerRole[] {
  return [...roles].sort((a, b) => a.posicion - b.posicion)
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
  miembros_roles: { roles_servidor: RolRow | null }[] | null
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

function mapRolesDeMiembro(filas: { roles_servidor: RolRow | null }[] | null): ServerRole[] {
  return ordenarRoles(
    (filas ?? [])
      .map((f) => f.roles_servidor)
      .filter((r): r is RolRow => r != null)
      .map(mapRol)
  )
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
    .select(
      'id, usuario_id, unido_at, silenciado_hasta, apodo, perfiles(*), miembros_roles(roles_servidor(*))'
    )
    .eq('servidor_id', servidorId)
    .order('unido_at', { ascending: true })
    .returns<MiembroRow[]>()

  if (error) throw error
  return (data ?? []).map((row) => ({
    membershipId: row.id,
    user: row.perfiles
      ? mapPerfilToChatUser(row.perfiles)
      : { id: row.usuario_id, name: 'Usuario', status: 'offline' as const },
    roles: mapRolesDeMiembro(row.miembros_roles),
    joinedAt: row.unido_at,
    silencedUntil: row.silenciado_hasta,
    nickname: row.apodo,
  }))
}

export interface MentionableMember {
  id: string
  username: string
  displayName: string
}

interface MiembroMencionRow {
  usuario_id: string
  perfiles: { nombre_usuario: string; nombre_completo: string | null } | null
}

export async function listarMiembrosParaMencion(
  servidorId: string
): Promise<MentionableMember[]> {
  const { data, error } = await supabase
    .from('miembros_servidor')
    .select('usuario_id, perfiles(nombre_usuario, nombre_completo)')
    .eq('servidor_id', servidorId)
    .returns<MiembroMencionRow[]>()

  if (error) throw error
  return (data ?? [])
    .filter((row) => row.perfiles)
    .map((row) => ({
      id: row.usuario_id,
      username: row.perfiles!.nombre_usuario,
      displayName: row.perfiles!.nombre_completo?.trim() || row.perfiles!.nombre_usuario,
    }))
}

export interface BannedMember {
  id: string
  userId: string
  reason: string | null
  createdAt: string
  expiresAt: string | null
  user: ChatUser
}

export async function actualizarRolDeMiembro(
  membershipId: string,
  rolId: string
): Promise<void> {
  const { error } = await supabase.rpc('actualizar_rol_miembro', {
    p_miembro_id: membershipId,
    p_nuevo_rol_id: rolId,
  })

  if (error) throw error
}

export async function agregarRolMiembro(membershipId: string, rolId: string): Promise<void> {
  const { error } = await supabase.rpc('agregar_rol_miembro', {
    p_miembro_id: membershipId,
    p_rol_id: rolId,
  })
  if (error) throw error
}

export async function quitarRolMiembro(membershipId: string, rolId: string): Promise<void> {
  const { error } = await supabase.rpc('quitar_rol_miembro', {
    p_miembro_id: membershipId,
    p_rol_id: rolId,
  })
  if (error) throw error
}

export async function expulsarMiembro(membershipId: string): Promise<void> {
  const { error } = await supabase.rpc('expulsar_miembro', {
    p_miembro_id: membershipId,
  })

  if (error) throw error
}

export async function banearMiembro(
  membershipId: string,
  razon?: string,
  minutos?: number
): Promise<void> {
  const { error } = await supabase.rpc('banear_miembro', {
    p_miembro_id: membershipId,
    p_razon: razon ?? null,
    p_minutos: minutos ?? null,
  })

  if (error) throw error
}

export async function desbanearMiembro(servidorId: string, usuarioId: string): Promise<void> {
  const { error } = await supabase.rpc('desbanear_miembro', {
    p_servidor_id: servidorId,
    p_usuario_id: usuarioId,
  })

  if (error) throw error
}

interface BaneadoRow {
  id: string
  usuario_id: string
  razon: string | null
  creado_at: string
  expira_at: string | null
  nombre_usuario: string
  nombre_completo: string | null
  avatar_url: string | null
}

export async function listarBaneados(servidorId: string): Promise<BannedMember[]> {
  const { data, error } = await supabase.rpc('listar_baneados', { p_servidor_id: servidorId })

  if (error) throw error
  return ((data ?? []) as BaneadoRow[]).map((row) => ({
    id: row.id,
    userId: row.usuario_id,
    reason: row.razon,
    createdAt: row.creado_at,
    expiresAt: row.expira_at,
    user: {
      id: row.usuario_id,
      name: row.nombre_completo?.trim() || row.nombre_usuario,
      avatarUrl: row.avatar_url ?? undefined,
      status: 'offline' as const,
    },
  }))
}

export async function silenciarMiembro(membershipId: string, minutos: number): Promise<void> {
  const { error } = await supabase.rpc('silenciar_miembro', {
    p_miembro_id: membershipId,
    p_minutos: minutos,
  })

  if (error) throw error
}

export async function quitarSilencioMiembro(membershipId: string): Promise<void> {
  const { error } = await supabase.rpc('quitar_silencio_miembro', {
    p_miembro_id: membershipId,
  })

  if (error) throw error
}

export async function actualizarApodoMiembro(membershipId: string, apodo: string): Promise<void> {
  const { error } = await supabase.rpc('actualizar_apodo_miembro', {
    p_miembro_id: membershipId,
    p_apodo: apodo,
  })

  if (error) throw error
}

export async function crearRolRapido(servidorId: string, nombre: string): Promise<ServerRole> {
  const { data, error } = await supabase
    .rpc('slash_crear_rol', { p_servidor_id: servidorId, p_nombre: nombre })
    .single<RolRow>()

  if (error) throw error
  return mapRol(data)
}

export async function renombrarRolRapido(
  servidorId: string,
  rolId: string,
  nombre: string
): Promise<ServerRole> {
  const { data, error } = await supabase
    .rpc('slash_renombrar_rol', { p_servidor_id: servidorId, p_rol_id: rolId, p_nombre: nombre })
    .single<RolRow>()

  if (error) throw error
  return mapRol(data)
}

export async function cambiarColorRolRapido(
  servidorId: string,
  rolId: string,
  color: string
): Promise<ServerRole> {
  const { data, error } = await supabase
    .rpc('slash_color_rol', { p_servidor_id: servidorId, p_rol_id: rolId, p_color: color })
    .single<RolRow>()

  if (error) throw error
  return mapRol(data)
}

export async function asignarRolRapido(
  servidorId: string,
  usuarioObjetivoId: string,
  rolId: string
): Promise<void> {
  const { error } = await supabase.rpc('slash_asignar_rol', {
    p_servidor_id: servidorId,
    p_usuario_objetivo_id: usuarioObjetivoId,
    p_rol_id: rolId,
  })
  if (error) throw error
}

export async function kickearMiembroRapido(servidorId: string, usuarioObjetivoId: string): Promise<void> {
  const { error } = await supabase.rpc('slash_kick', {
    p_servidor_id: servidorId,
    p_usuario_objetivo_id: usuarioObjetivoId,
  })
  if (error) throw error
}

export async function banearMiembroRapido(
  servidorId: string,
  usuarioObjetivoId: string,
  razon?: string
): Promise<void> {
  const { error } = await supabase.rpc('slash_ban', {
    p_servidor_id: servidorId,
    p_usuario_objetivo_id: usuarioObjetivoId,
    p_razon: razon?.trim() || null,
  })
  if (error) throw error
}

export async function banearMiembroTemporalRapido(
  servidorId: string,
  usuarioObjetivoId: string,
  minutos: number,
  razon?: string
): Promise<void> {
  const { error } = await supabase.rpc('slash_tempban', {
    p_servidor_id: servidorId,
    p_usuario_objetivo_id: usuarioObjetivoId,
    p_minutos: minutos,
    p_razon: razon?.trim() || null,
  })
  if (error) throw error
}

export async function silenciarMiembroRapido(
  servidorId: string,
  usuarioObjetivoId: string,
  minutos: number
): Promise<void> {
  const { error } = await supabase.rpc('slash_mute', {
    p_servidor_id: servidorId,
    p_usuario_objetivo_id: usuarioObjetivoId,
    p_minutos: minutos,
  })
  if (error) throw error
}

export async function advertirMiembroRapido(
  servidorId: string,
  usuarioObjetivoId: string,
  razon: string
): Promise<number> {
  const { data, error } = await supabase.rpc('slash_advertir_miembro', {
    p_servidor_id: servidorId,
    p_usuario_objetivo_id: usuarioObjetivoId,
    p_razon: razon,
  })
  if (error) throw error
  return data as number
}
