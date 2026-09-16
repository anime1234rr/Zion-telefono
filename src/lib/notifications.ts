import { supabase } from '@/lib/supabase'
import { uniqueId } from '@/lib/id'

export type NotificationType =
  | 'mencion'
  | 'invitacion'
  | 'sistema'
  | 'mensaje_privado'
  | 'solicitud_amistad'

export interface AppNotification {
  id: string
  servidorId: string | null
  tipo: NotificationType
  titulo: string
  mensaje: string
  leida: boolean
  enlace: string | null
  creadoAt: string
}

interface NotificacionRow {
  id: string
  usuario_id: string
  servidor_id: string | null
  tipo: string
  titulo: string
  mensaje: string
  leida: boolean
  enlace: string | null
  creado_at: string
}

function mapNotificacion(row: NotificacionRow): AppNotification {
  return {
    id: row.id,
    servidorId: row.servidor_id,
    tipo: row.tipo as NotificationType,
    titulo: row.titulo,
    mensaje: row.mensaje,
    leida: row.leida,
    enlace: row.enlace,
    creadoAt: row.creado_at,
  }
}

export async function listarNotificaciones(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', userId)
    .order('creado_at', { ascending: false })
    .limit(50)
    .returns<NotificacionRow[]>()

  if (error) throw error
  return (data ?? []).map(mapNotificacion)
}

export async function marcarNotificacionLeida(notificacionId?: string): Promise<void> {
  const { error } = await supabase.rpc('marcar_notificaciones_leidas', {
    p_notificacion_id: notificacionId ?? null,
  })
  if (error) throw error
}

export async function eliminarNotificacion(notificacionId: string): Promise<void> {
  const { error } = await supabase
    .from('notificaciones')
    .delete()
    .eq('id', notificacionId)

  if (error) throw error
}

export function suscribirseANotificaciones(
  userId: string,
  onNueva: (notificacion: AppNotification) => void
) {
  const channel = supabase
    .channel(`notificaciones-${userId}-${uniqueId()}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `usuario_id=eq.${userId}`,
      },
      (payload) => {
        onNueva(mapNotificacion(payload.new as NotificacionRow))
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export interface ResumenMenciones {
  total: number
  porServidor: Map<string, number>
  porCanal: Map<string, number>
}

const CANAL_EN_ENLACE = /\/canal\/([0-9a-f-]{36})\//i

export async function contarMencionesNoLeidas(userId: string): Promise<ResumenMenciones> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('servidor_id, enlace')
    .eq('usuario_id', userId)
    .eq('tipo', 'mencion')
    .eq('leida', false)
    .returns<{ servidor_id: string | null; enlace: string | null }[]>()

  if (error) throw error

  const porServidor = new Map<string, number>()
  const porCanal = new Map<string, number>()
  for (const fila of data ?? []) {
    if (fila.servidor_id) {
      porServidor.set(fila.servidor_id, (porServidor.get(fila.servidor_id) ?? 0) + 1)
    }
    const canal = fila.enlace ? CANAL_EN_ENLACE.exec(fila.enlace)?.[1] : null
    if (canal) porCanal.set(canal, (porCanal.get(canal) ?? 0) + 1)
  }
  return { total: (data ?? []).length, porServidor, porCanal }
}

export async function marcarMencionesCanalLeidas(canalId: string): Promise<void> {
  const { error } = await supabase.rpc('marcar_menciones_canal_leidas', { p_canal_id: canalId })
  if (error) throw error
}
