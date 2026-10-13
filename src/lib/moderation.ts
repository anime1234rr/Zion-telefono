import { supabase } from '@/lib/supabase'

export type TipoSancion = 'advertencia' | 'ban_temporal' | 'ban_permanente'
export type EstadoCuenta = 'activo' | 'advertido' | 'ban_temporal' | 'ban_permanente'
export type TipoRolStaff = 'core_dev' | 'frontend_dev' | 'moderador'

export interface Sancion {
  id: string
  tipo: TipoSancion
  motivo: string
  creadoAt: string
  expiraAt: string | null
  activa: boolean
  revocadaAt: string | null
  revocadaMotivo: string | null
  reconocidaAt: string | null
}

export interface SancionConAutor extends Sancion {
  aplicadoPorNombre: string | null
  revocadaPorNombre: string | null
}

interface MiSancionRow {
  id: string
  tipo: TipoSancion
  motivo: string
  creado_at: string
  expira_at: string | null
  activa: boolean
  revocada_at: string | null
  revocada_motivo: string | null
  reconocida_at: string | null
}

interface SancionUsuarioRow extends MiSancionRow {
  aplicado_por_nombre: string | null
  revocada_por_nombre: string | null
}

export async function obtenerMisSanciones(): Promise<Sancion[]> {
  const { data, error } = await supabase.rpc('obtener_mis_sanciones')
  if (error) throw error
  return ((data ?? []) as MiSancionRow[]).map((row) => ({
    id: row.id,
    tipo: row.tipo,
    motivo: row.motivo,
    creadoAt: row.creado_at,
    expiraAt: row.expira_at,
    activa: row.activa,
    revocadaAt: row.revocada_at,
    revocadaMotivo: row.revocada_motivo,
    reconocidaAt: row.reconocida_at,
  }))
}

export function esBanActivo(sancion: Sancion): boolean {
  if (!sancion.activa) return false
  if (sancion.tipo === 'advertencia') return false
  if (sancion.expiraAt && new Date(sancion.expiraAt).getTime() <= Date.now()) return false
  return true
}

export async function listarSancionesUsuario(usuarioId: string): Promise<SancionConAutor[]> {
  const { data, error } = await supabase.rpc('listar_sanciones_usuario', { p_usuario_id: usuarioId })
  if (error) throw error
  return ((data ?? []) as SancionUsuarioRow[]).map((row) => ({
    id: row.id,
    tipo: row.tipo,
    motivo: row.motivo,
    creadoAt: row.creado_at,
    expiraAt: row.expira_at,
    activa: row.activa,
    revocadaAt: row.revocada_at,
    revocadaMotivo: row.revocada_motivo,
    reconocidaAt: row.reconocida_at,
    aplicadoPorNombre: row.aplicado_por_nombre,
    revocadaPorNombre: row.revocada_por_nombre,
  }))
}

export async function aplicarSancion(
  usuarioId: string,
  tipo: TipoSancion,
  motivo: string,
  minutos?: number
): Promise<string> {
  const { data, error } = await supabase.rpc('aplicar_sancion', {
    p_usuario_id: usuarioId,
    p_tipo: tipo,
    p_motivo: motivo,
    p_minutos: minutos ?? null,
  })
  if (error) throw error
  return data as string
}

export async function revocarSancion(sancionId: string, motivo?: string): Promise<void> {
  const { error } = await supabase.rpc('revocar_sancion', {
    p_sancion_id: sancionId,
    p_motivo: motivo ?? null,
  })
  if (error) throw error
}

export async function reconocerSancion(sancionId: string): Promise<void> {
  const { error } = await supabase.rpc('reconocer_sancion', { p_sancion_id: sancionId })
  if (error) throw error
}

export interface UsuarioStaffResultado {
  id: string
  nombreUsuario: string
  nombreCompleto: string | null
  avatarUrl: string | null
  estadoCuenta: EstadoCuenta
  banExpiraAt: string | null
  rolStaff: TipoRolStaff | null
}

interface UsuarioStaffRow {
  id: string
  nombre_usuario: string
  nombre_completo: string | null
  avatar_url: string | null
  estado_sancion: EstadoCuenta
  ban_expira_at: string | null
  rol_staff: TipoRolStaff | null
}

export async function buscarUsuariosStaff(termino: string): Promise<UsuarioStaffResultado[]> {
  const limpio = termino.trim()
  if (!limpio) return []

  const { data, error } = await supabase.rpc('buscar_usuarios_staff', { p_termino: limpio })
  if (error) throw error
  return ((data ?? []) as UsuarioStaffRow[]).map((row) => ({
    id: row.id,
    nombreUsuario: row.nombre_usuario,
    nombreCompleto: row.nombre_completo,
    avatarUrl: row.avatar_url,
    estadoCuenta: row.estado_sancion,
    banExpiraAt: row.ban_expira_at,
    rolStaff: row.rol_staff,
  }))
}

export interface SancionReciente {
  id: string
  usuarioId: string
  nombreUsuario: string
  avatarUrl: string | null
  tipo: TipoSancion
  motivo: string
  creadoAt: string
  activa: boolean
}

interface SancionRecienteRow {
  id: string
  usuario_id: string
  nombre_usuario: string
  avatar_url: string | null
  tipo: TipoSancion
  motivo: string
  creado_at: string
  activa: boolean
}

export async function listarSancionesRecientes(limite = 8): Promise<SancionReciente[]> {
  const { data, error } = await supabase.rpc('listar_sanciones_recientes', { p_limite: limite })
  if (error) throw error
  return ((data ?? []) as SancionRecienteRow[]).map((row) => ({
    id: row.id,
    usuarioId: row.usuario_id,
    nombreUsuario: row.nombre_usuario,
    avatarUrl: row.avatar_url,
    tipo: row.tipo,
    motivo: row.motivo,
    creadoAt: row.creado_at,
    activa: row.activa,
  }))
}

export interface EstadisticasSanciones {
  advertenciasActivas: number
  bansTemporalesActivos: number
  bansPermanentesActivos: number
}

export async function obtenerEstadisticasSanciones(): Promise<EstadisticasSanciones> {
  const { data, error } = await supabase.rpc('obtener_estadisticas_sanciones').single<{
    advertencias_activas: number
    bans_temporales_activos: number
    bans_permanentes_activos: number
  }>()
  if (error) throw error
  return {
    advertenciasActivas: Number(data?.advertencias_activas ?? 0),
    bansTemporalesActivos: Number(data?.bans_temporales_activos ?? 0),
    bansPermanentesActivos: Number(data?.bans_permanentes_activos ?? 0),
  }
}

export interface RolStaff {
  tipo: TipoRolStaff
  permisos: Record<string, boolean>
  creadoAt: string
}

interface RolStaffRow {
  tipo: TipoRolStaff
  permisos: Record<string, boolean>
  creado_at: string
}

export async function listarRolesStaffUsuario(usuarioId: string): Promise<RolStaff[]> {
  const { data, error } = await supabase.rpc('listar_roles_staff_usuario', { p_usuario_id: usuarioId })
  if (error) throw error
  return ((data ?? []) as RolStaffRow[]).map((row) => ({
    tipo: row.tipo,
    permisos: row.permisos ?? {},
    creadoAt: row.creado_at,
  }))
}

export async function asignarRolStaff(
  usuarioId: string,
  tipo: TipoRolStaff,
  permisos?: Record<string, boolean>
): Promise<void> {
  const { error } = await supabase.rpc('asignar_rol_staff', {
    p_usuario_id: usuarioId,
    p_tipo: tipo,
    p_permisos: permisos ?? null,
  })
  if (error) throw error
}

export async function quitarRolStaff(usuarioId: string, tipo: TipoRolStaff): Promise<void> {
  const { error } = await supabase.rpc('quitar_rol_staff', { p_usuario_id: usuarioId, p_tipo: tipo })
  if (error) throw error
}

export function mensajeErrorSancion(error: unknown): string | null {
  const texto =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ((error as { message?: string } | null)?.message ?? '')

  if (texto.includes('CUENTA_SUSPENDIDA_PERMANENTE')) {
    return 'Tu cuenta está suspendida permanentemente y no podés realizar esta acción.'
  }
  if (texto.includes('CUENTA_SUSPENDIDA_TEMPORAL')) {
    return 'Tu cuenta está suspendida temporalmente y no podés realizar esta acción.'
  }
  return null
}
