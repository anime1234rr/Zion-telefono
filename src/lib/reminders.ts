import { supabase } from '@/lib/supabase'

export interface RecordatorioMensaje {
  id: string
  mensajeId: string
  titulo: string
  cuerpo: string
  enlace: string | null
  recordarEn: string
  creadoAt: string
}

interface RecordatorioMensajeRow {
  id: string
  mensaje_id: string
  titulo: string
  cuerpo: string
  enlace: string | null
  recordar_en: string
  creado_at: string
}

function mapRecordatorio(row: RecordatorioMensajeRow): RecordatorioMensaje {
  return {
    id: row.id,
    mensajeId: row.mensaje_id,
    titulo: row.titulo,
    cuerpo: row.cuerpo,
    enlace: row.enlace,
    recordarEn: row.recordar_en,
    creadoAt: row.creado_at,
  }
}

export async function crearRecordatorioMensaje(params: {
  mensajeId: string
  titulo: string
  cuerpo: string
  enlace?: string | null
  recordarEn: Date
}): Promise<RecordatorioMensaje> {
  const { data, error } = await supabase
    .from('recordatorios_mensaje')
    .insert({
      mensaje_id: params.mensajeId,
      titulo: params.titulo,
      cuerpo: params.cuerpo,
      enlace: params.enlace ?? null,
      recordar_en: params.recordarEn.toISOString(),
    })
    .select('*')
    .single<RecordatorioMensajeRow>()

  if (error) throw error
  return mapRecordatorio(data)
}

export async function cancelarRecordatorioMensaje(id: string): Promise<void> {
  const { error } = await supabase.from('recordatorios_mensaje').delete().eq('id', id)
  if (error) throw error
}

export async function listarRecordatoriosPendientes(): Promise<RecordatorioMensaje[]> {
  const { data, error } = await supabase
    .from('recordatorios_mensaje')
    .select('*')
    .eq('enviado', false)
    .order('recordar_en', { ascending: true })
    .returns<RecordatorioMensajeRow[]>()

  if (error) throw error
  return (data ?? []).map(mapRecordatorio)
}

export type PresetRecordatorio = 'en_una_hora' | 'esta_noche' | 'manana' | 'semana_que_viene'

export const PRESETS_RECORDATORIO: { value: PresetRecordatorio; label: string }[] = [
  { value: 'en_una_hora', label: 'En 1 hora' },
  { value: 'esta_noche', label: 'Esta noche' },
  { value: 'manana', label: 'Mañana' },
  { value: 'semana_que_viene', label: 'La semana que viene' },
]

export function calcularFechaPreset(preset: PresetRecordatorio, ahora: Date = new Date()): Date {
  const fecha = new Date(ahora)

  if (preset === 'en_una_hora') {
    fecha.setHours(fecha.getHours() + 1)
    return fecha
  }

  if (preset === 'esta_noche') {
    fecha.setHours(20, 0, 0, 0)
    if (fecha.getTime() <= ahora.getTime()) {
      fecha.setDate(fecha.getDate() + 1)
      fecha.setHours(9, 0, 0, 0)
    }
    return fecha
  }

  if (preset === 'manana') {
    fecha.setDate(fecha.getDate() + 1)
    fecha.setHours(9, 0, 0, 0)
    return fecha
  }

  fecha.setDate(fecha.getDate() + 7)
  fecha.setHours(9, 0, 0, 0)
  return fecha
}
