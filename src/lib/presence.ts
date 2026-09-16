import { supabase } from '@/lib/supabase'

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
