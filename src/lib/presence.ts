import { supabase } from '@/lib/supabase'
import { uniqueId } from '@/lib/id'
import type { PerfilRow } from '@/lib/profiles'

const HEARTBEAT_INTERVAL_MS = 45_000

export async function marcarConectado(): Promise<void> {
  const { error } = await supabase.rpc('marcar_conectado')
  if (error) throw error
}

export async function marcarDesconectadoPorCierre(): Promise<void> {
  const { error } = await supabase.rpc('actualizar_estado_usuario', {
    p_nuevo_estado: 'desconectado_cierre',
  })
  if (error) throw error
}

export function iniciarHeartbeat(): () => void {
  const interval = setInterval(() => {
    supabase.rpc('tocar_presencia').then(({ error }) => {
      if (error) console.error('No se pudo refrescar la presencia', error)
    })
  }, HEARTBEAT_INTERVAL_MS)

  return () => clearInterval(interval)
}

export interface PresenciaDispositivo {
  hayOtrosDispositivos: () => boolean
  pausar: () => void
  reanudar: () => void
  detener: () => void
}

export function iniciarPresenciaDispositivo(userId: string): PresenciaDispositivo {
  const deviceId = uniqueId()
  let activo = true
  const channel = supabase.channel(`dispositivos-${userId}`, {
    config: { presence: { key: deviceId } },
  })

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED' && activo) channel.track({ plataforma: 'movil' }).catch(() => {})
  })

  return {
    hayOtrosDispositivos: () =>
      Object.keys(channel.presenceState()).some((key) => key !== deviceId),
    pausar: () => {
      activo = false
      channel.untrack().catch(() => {})
    },
    reanudar: () => {
      activo = true
      channel.track({ plataforma: 'movil' }).catch(() => {})
    },
    detener: () => {
      activo = false
      supabase.removeChannel(channel)
    },
  }
}

export function suscribirseAMiPerfil(userId: string, onCambio: (row: PerfilRow) => void): () => void {
  const channel = supabase
    .channel(`mi-perfil-${userId}-${uniqueId()}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'perfiles', filter: `id=eq.${userId}` },
      (payload) => onCambio(payload.new as PerfilRow)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
