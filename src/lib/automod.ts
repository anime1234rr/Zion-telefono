import { supabase } from '@/lib/supabase'

export type AdjuntosPermitidos = 'todos' | 'solo_imagenes' | 'ninguno'

export interface AutomodConfig {
  palabrasBloqueadas: string[]
  slowmodeSegundos: number
  edadMinimaHoras: number
  raidUmbralJoins: number
  raidVentanaSegundos: number
  raidCooldownSegundos: number
  raidBloqueadoHasta: string | null
  bloquearEnlaces: boolean
  maxMenciones: number
  adjuntosPermitidos: AdjuntosPermitidos
}

export const AUTOMOD_VACIO: AutomodConfig = {
  palabrasBloqueadas: [],
  slowmodeSegundos: 0,
  edadMinimaHoras: 0,
  raidUmbralJoins: 0,
  raidVentanaSegundos: 60,
  raidCooldownSegundos: 600,
  raidBloqueadoHasta: null,
  bloquearEnlaces: false,
  maxMenciones: 0,
  adjuntosPermitidos: 'todos',
}

interface AutomodRow {
  palabras_bloqueadas: string[] | null
  slowmode_segundos: number | null
  edad_minima_horas: number | null
  raid_umbral_joins: number | null
  raid_ventana_segundos: number | null
  raid_cooldown_segundos: number | null
  raid_bloqueado_hasta: string | null
  bloquear_enlaces: boolean | null
  max_menciones: number | null
  adjuntos_permitidos: string | null
}

const COLUMNAS =
  'palabras_bloqueadas, slowmode_segundos, edad_minima_horas, raid_umbral_joins, raid_ventana_segundos, raid_cooldown_segundos, raid_bloqueado_hasta, bloquear_enlaces, max_menciones, adjuntos_permitidos'

function normalizarAdjuntos(valor: string | null): AdjuntosPermitidos {
  return valor === 'solo_imagenes' || valor === 'ninguno' ? valor : 'todos'
}

function mapRow(row: AutomodRow): AutomodConfig {
  return {
    palabrasBloqueadas: row.palabras_bloqueadas ?? [],
    slowmodeSegundos: row.slowmode_segundos ?? 0,
    edadMinimaHoras: row.edad_minima_horas ?? 0,
    raidUmbralJoins: row.raid_umbral_joins ?? 0,
    raidVentanaSegundos: row.raid_ventana_segundos ?? 60,
    raidCooldownSegundos: row.raid_cooldown_segundos ?? 600,
    raidBloqueadoHasta: row.raid_bloqueado_hasta,
    bloquearEnlaces: row.bloquear_enlaces ?? false,
    maxMenciones: row.max_menciones ?? 0,
    adjuntosPermitidos: normalizarAdjuntos(row.adjuntos_permitidos),
  }
}

export async function obtenerAutomodConfig(servidorId: string): Promise<AutomodConfig> {
  const { data, error } = await supabase
    .from('automod_config')
    .select(COLUMNAS)
    .eq('servidor_id', servidorId)
    .maybeSingle<AutomodRow>()

  if (error) throw error
  return data ? mapRow(data) : { ...AUTOMOD_VACIO }
}

export async function guardarAutomodConfig(
  servidorId: string,
  cfg: AutomodConfig
): Promise<AutomodConfig> {
  const palabras = cfg.palabrasBloqueadas
    .map((p) => p.trim().toLowerCase())
    .filter((p, i, arr) => p !== '' && arr.indexOf(p) === i)

  const { data, error } = await supabase
    .from('automod_config')
    .upsert(
      {
        servidor_id: servidorId,
        palabras_bloqueadas: palabras,
        slowmode_segundos: Math.max(0, Math.round(cfg.slowmodeSegundos)),
        edad_minima_horas: Math.max(0, Math.round(cfg.edadMinimaHoras)),
        raid_umbral_joins: Math.max(0, Math.round(cfg.raidUmbralJoins)),
        raid_ventana_segundos: Math.max(5, Math.round(cfg.raidVentanaSegundos)),
        raid_cooldown_segundos: Math.max(30, Math.round(cfg.raidCooldownSegundos)),
        bloquear_enlaces: cfg.bloquearEnlaces,
        max_menciones: Math.max(0, Math.round(cfg.maxMenciones)),
        adjuntos_permitidos: cfg.adjuntosPermitidos,
        actualizado_at: new Date().toISOString(),
      },
      { onConflict: 'servidor_id' }
    )
    .select(COLUMNAS)
    .single<AutomodRow>()

  if (error) throw error
  return mapRow(data)
}

export async function levantarBloqueoRaid(servidorId: string): Promise<void> {
  const { error } = await supabase
    .from('automod_config')
    .update({ raid_bloqueado_hasta: null })
    .eq('servidor_id', servidorId)

  if (error) throw error
}

export function mensajeErrorAutomod(error: unknown): string | null {
  const texto =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : ((error as { message?: string } | null)?.message ?? '')

  if (texto.includes('AUTOMOD_PALABRA')) {
    return 'Tu mensaje contiene una palabra bloqueada en este servidor.'
  }
  if (texto.includes('AUTOMOD_CUENTA_NUEVA')) {
    return 'Tu cuenta es demasiado nueva para escribir en este servidor. Probá más tarde.'
  }
  if (texto.includes('AUTOMOD_SLOWMODE')) {
    return 'El modo lento está activo. Esperá unos segundos antes de enviar otro mensaje.'
  }
  if (texto.includes('AUTOMOD_RAID')) {
    return 'Este servidor pausó los ingresos por un pico de actividad sospechosa. Probá más tarde.'
  }
  if (texto.includes('AUTOMOD_ENLACE')) {
    return 'Este servidor no permite enviar enlaces en los mensajes.'
  }
  if (texto.includes('AUTOMOD_MENCIONES')) {
    return 'Tu mensaje tiene demasiadas menciones para este servidor.'
  }
  if (texto.includes('AUTOMOD_ADJUNTO_TIPO')) {
    return 'Este servidor solo permite adjuntar imágenes.'
  }
  if (texto.includes('AUTOMOD_ADJUNTO')) {
    return 'Este servidor no permite adjuntar archivos.'
  }
  return null
}
