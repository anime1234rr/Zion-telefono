import { supabase } from '@/lib/supabase'

export interface ResumenPlataforma {
  usuariosTotales: number
  servidoresTotales: number
  comunidadesEnExplorar: number
  reportesAbiertos: number
  reportesUltimos7Dias: number
  usuariosNuevos7Dias: number
}

interface ResumenPlataformaRow {
  usuarios_totales: number | string
  servidores_totales: number | string
  comunidades_en_explorar: number | string
  reportes_abiertos: number | string
  reportes_ultimos_7_dias: number | string
  usuarios_nuevos_7_dias: number | string
}

export async function obtenerResumenPlataforma(): Promise<ResumenPlataforma | null> {
  const { data, error } = await supabase.rpc('staff_resumen_plataforma')
  if (error) throw error
  const row = ((data ?? []) as ResumenPlataformaRow[])[0]
  if (!row) return null
  return {
    usuariosTotales: Number(row.usuarios_totales),
    servidoresTotales: Number(row.servidores_totales),
    comunidadesEnExplorar: Number(row.comunidades_en_explorar),
    reportesAbiertos: Number(row.reportes_abiertos),
    reportesUltimos7Dias: Number(row.reportes_ultimos_7_dias),
    usuariosNuevos7Dias: Number(row.usuarios_nuevos_7_dias),
  }
}

export interface EtiquetaServidorStaff {
  id: string
  nombre: string
}

export interface ServidorStaff {
  id: string
  nombre: string
  iconoUrl: string | null
  descripcion: string | null
  propietarioId: string | null
  propietarioNombre: string | null
  cantidadMiembros: number
  comunidadActiva: boolean
  listadoPorStaff: boolean
  listadoPorNombre: string | null
  listadoAt: string | null
  creadoAt: string
  etiquetas: EtiquetaServidorStaff[]
}

interface ServidorStaffRow {
  id: string
  nombre: string
  icono_url: string | null
  descripcion: string | null
  propietario_id: string | null
  propietario_nombre: string | null
  cantidad_miembros: number | string
  comunidad_activa: boolean
  listado_por_staff: boolean
  listado_por_nombre: string | null
  listado_at: string | null
  creado_at: string
  etiquetas: EtiquetaServidorStaff[] | null
}

export async function staffListarServidores(query: string): Promise<ServidorStaff[]> {
  const { data, error } = await supabase.rpc('staff_listar_servidores', {
    p_query: query.trim() || null,
    p_limite: 100,
  })
  if (error) throw error
  return ((data ?? []) as ServidorStaffRow[]).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    iconoUrl: row.icono_url,
    descripcion: row.descripcion,
    propietarioId: row.propietario_id,
    propietarioNombre: row.propietario_nombre,
    cantidadMiembros: Number(row.cantidad_miembros ?? 0),
    comunidadActiva: row.comunidad_activa,
    listadoPorStaff: row.listado_por_staff,
    listadoPorNombre: row.listado_por_nombre,
    listadoAt: row.listado_at,
    creadoAt: row.creado_at,
    etiquetas: row.etiquetas ?? [],
  }))
}

export async function staffCambiarListadoServidor(servidorId: string, listado: boolean): Promise<void> {
  const { error } = await supabase.rpc('staff_cambiar_listado_servidor', {
    p_servidor_id: servidorId,
    p_listado: listado,
  })
  if (error) throw error
}

export async function staffQuitarEtiquetaServidor(servidorId: string, etiquetaId: string): Promise<void> {
  const { error } = await supabase.rpc('staff_quitar_etiqueta_servidor', {
    p_servidor_id: servidorId,
    p_etiqueta_id: etiquetaId,
  })
  if (error) throw error
}
