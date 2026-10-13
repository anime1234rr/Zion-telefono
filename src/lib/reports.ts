import { supabase } from '@/lib/supabase'

export type MotivoReporte =
  | 'acoso'
  | 'amenazas'
  | 'discurso_odio'
  | 'spam'
  | 'estafa'
  | 'contenido_sexual'
  | 'contenido_violento'
  | 'suplantacion'
  | 'autolesion'
  | 'contenido_ilegal'
  | 'otro'

export type EstadoReporte = 'pendiente' | 'en_revision' | 'resuelto' | 'descartado' | 'falso'

export type OrigenEvidencia = 'canal' | 'directo'

export const MOTIVOS_REPORTE: { valor: MotivoReporte; label: string; descripcion: string }[] = [
  { valor: 'acoso', label: 'Acoso', descripcion: 'Insultos, hostigamiento o persecución.' },
  { valor: 'amenazas', label: 'Amenazas', descripcion: 'Amenazas de violencia o de exponer a alguien.' },
  { valor: 'discurso_odio', label: 'Discurso de odio', descripcion: 'Ataques por origen, religión, género u otra condición.' },
  { valor: 'spam', label: 'Spam', descripcion: 'Mensajes masivos, publicidad o enlaces no pedidos.' },
  { valor: 'estafa', label: 'Estafa', descripcion: 'Engaños para obtener dinero, cuentas o datos.' },
  { valor: 'contenido_sexual', label: 'Contenido sexual', descripcion: 'Contenido sexual no consentido o fuera de lugar.' },
  { valor: 'contenido_violento', label: 'Contenido violento', descripcion: 'Violencia real, gore o crueldad.' },
  { valor: 'suplantacion', label: 'Suplantación', descripcion: 'Se hace pasar por otra persona, marca o el staff.' },
  { valor: 'autolesion', label: 'Autolesión', descripcion: 'Promueve el suicidio o las autolesiones.' },
  { valor: 'contenido_ilegal', label: 'Contenido ilegal', descripcion: 'Venta de drogas, armas u otro contenido ilegal.' },
  { valor: 'otro', label: 'Otro', descripcion: 'Otra infracción a los Términos de servicio.' },
]

export const ETIQUETA_MOTIVO: Record<MotivoReporte, string> = Object.fromEntries(
  MOTIVOS_REPORTE.map((m) => [m.valor, m.label])
) as Record<MotivoReporte, string>

export const ETIQUETA_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
  descartado: 'Descartado',
  falso: 'Falso',
}

export const DESCRIPCION_MINIMA = 20
export const DESCRIPCION_MAXIMA = 2000
export const MAX_EVIDENCIAS = 10

export interface MensajeReportable {
  origen: OrigenEvidencia
  id: string
  contenido: string | null
  adjuntoUrl: string | null
  adjuntoTipo: string | null
  creadoAt: string
  editado: boolean
  contexto: string
}

interface MensajeReportableRow {
  origen: OrigenEvidencia
  id: string
  contenido: string | null
  adjunto_url: string | null
  adjunto_tipo: string | null
  creado_at: string
  editado: boolean
  contexto: string
}

export async function listarMensajesReportables(usuarioId: string): Promise<MensajeReportable[]> {
  const { data, error } = await supabase.rpc('mensajes_reportables', {
    p_usuario_id: usuarioId,
    p_limite: 100,
  })
  if (error) throw error
  return ((data ?? []) as MensajeReportableRow[]).map((row) => ({
    origen: row.origen,
    id: row.id,
    contenido: row.contenido,
    adjuntoUrl: row.adjunto_url,
    adjuntoTipo: row.adjunto_tipo,
    creadoAt: row.creado_at,
    editado: row.editado,
    contexto: row.contexto,
  }))
}

export async function crearReporteUsuario(params: {
  reportadoId: string
  motivo: MotivoReporte
  descripcion: string
  evidencias: { origen: OrigenEvidencia; id: string }[]
}): Promise<string> {
  const { data, error } = await supabase.rpc('crear_reporte_usuario', {
    p_reportado_id: params.reportadoId,
    p_motivo: params.motivo,
    p_descripcion: params.descripcion.trim(),
    p_evidencias: params.evidencias,
  })
  if (error) throw error
  return data as string
}

export interface ReporteStaff {
  id: string
  reportanteId: string
  reportanteNombre: string
  reportanteAvatar: string | null
  reportadoId: string
  reportadoNombre: string
  reportadoAvatar: string | null
  motivo: MotivoReporte
  descripcion: string
  estado: EstadoReporte
  resolucion: string | null
  creadoAt: string
  revisadoAt: string | null
  revisadoPorNombre: string | null
  cantidadEvidencias: number
  reportesContraReportado: number
  reportesFalsosReportante: number
}

interface ReporteStaffRow {
  id: string
  reportante_id: string
  reportante_nombre: string
  reportante_avatar: string | null
  reportado_id: string
  reportado_nombre: string
  reportado_avatar: string | null
  motivo: MotivoReporte
  descripcion: string
  estado: EstadoReporte
  resolucion: string | null
  creado_at: string
  revisado_at: string | null
  revisado_por_nombre: string | null
  cantidad_evidencias: number | string
  reportes_contra_reportado: number | string
  reportes_falsos_reportante: number | string
}

export type FiltroReportes = 'abiertos' | 'todos' | EstadoReporte

export async function staffListarReportes(filtro: FiltroReportes): Promise<ReporteStaff[]> {
  const { data, error } = await supabase.rpc('staff_listar_reportes', {
    p_estado: filtro,
    p_limite: 100,
  })
  if (error) throw error
  return ((data ?? []) as ReporteStaffRow[]).map((row) => ({
    id: row.id,
    reportanteId: row.reportante_id,
    reportanteNombre: row.reportante_nombre,
    reportanteAvatar: row.reportante_avatar,
    reportadoId: row.reportado_id,
    reportadoNombre: row.reportado_nombre,
    reportadoAvatar: row.reportado_avatar,
    motivo: row.motivo,
    descripcion: row.descripcion,
    estado: row.estado,
    resolucion: row.resolucion,
    creadoAt: row.creado_at,
    revisadoAt: row.revisado_at,
    revisadoPorNombre: row.revisado_por_nombre,
    cantidadEvidencias: Number(row.cantidad_evidencias ?? 0),
    reportesContraReportado: Number(row.reportes_contra_reportado ?? 0),
    reportesFalsosReportante: Number(row.reportes_falsos_reportante ?? 0),
  }))
}

export interface EvidenciaStaff {
  id: string
  origen: OrigenEvidencia
  mensajeId: string
  contenido: string | null
  adjuntoUrl: string | null
  adjuntoTipo: string | null
  editado: boolean
  contexto: string | null
  mensajeCreadoAt: string
  capturadoAt: string
  integridadOk: boolean
  sigueExistiendo: boolean
  cambioDespues: boolean
}

interface EvidenciaStaffRow {
  id: string
  origen: OrigenEvidencia
  mensaje_id: string
  contenido: string | null
  adjunto_url: string | null
  adjunto_tipo: string | null
  editado: boolean
  contexto: string | null
  mensaje_creado_at: string
  capturado_at: string
  integridad_ok: boolean
  sigue_existiendo: boolean
  cambio_despues: boolean
}

export async function staffObtenerEvidencias(reporteId: string): Promise<EvidenciaStaff[]> {
  const { data, error } = await supabase.rpc('staff_obtener_evidencias', { p_reporte_id: reporteId })
  if (error) throw error
  return ((data ?? []) as EvidenciaStaffRow[]).map((row) => ({
    id: row.id,
    origen: row.origen,
    mensajeId: row.mensaje_id,
    contenido: row.contenido,
    adjuntoUrl: row.adjunto_url,
    adjuntoTipo: row.adjunto_tipo,
    editado: row.editado,
    contexto: row.contexto,
    mensajeCreadoAt: row.mensaje_creado_at,
    capturadoAt: row.capturado_at,
    integridadOk: row.integridad_ok,
    sigueExistiendo: row.sigue_existiendo,
    cambioDespues: row.cambio_despues,
  }))
}

export type SancionPorReporte = 'advertencia' | 'ban_temporal' | 'ban_permanente'

export async function staffResolverReporte(params: {
  reporteId: string
  estado: Exclude<EstadoReporte, 'pendiente'>
  resolucion?: string
  sancion?: SancionPorReporte
  minutos?: number
}): Promise<void> {
  const { error } = await supabase.rpc('staff_resolver_reporte', {
    p_reporte_id: params.reporteId,
    p_estado: params.estado,
    p_resolucion: params.resolucion?.trim() || null,
    p_sancion_tipo: params.sancion ?? null,
    p_minutos: params.minutos ?? null,
  })
  if (error) throw error
}

export async function staffContarReportesAbiertos(): Promise<number> {
  const { data, error } = await supabase.rpc('staff_contar_reportes_abiertos')
  if (error) throw error
  return Number(data ?? 0)
}

export interface MiReporte {
  id: string
  reportadoId: string
  reportadoNombre: string
  motivo: MotivoReporte
  estado: EstadoReporte
  resolucion: string | null
  creadoAt: string
  revisadoAt: string | null
}

interface MiReporteRow {
  id: string
  reportado_id: string
  reportado_nombre: string
  motivo: MotivoReporte
  estado: EstadoReporte
  resolucion: string | null
  creado_at: string
  revisado_at: string | null
}

export async function listarMisReportes(): Promise<MiReporte[]> {
  const { data, error } = await supabase.rpc('listar_mis_reportes')
  if (error) throw error
  return ((data ?? []) as MiReporteRow[]).map((row) => ({
    id: row.id,
    reportadoId: row.reportado_id,
    reportadoNombre: row.reportado_nombre,
    motivo: row.motivo,
    estado: row.estado,
    resolucion: row.resolucion,
    creadoAt: row.creado_at,
    revisadoAt: row.revisado_at,
  }))
}
