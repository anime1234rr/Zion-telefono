import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

interface CanalCompartido {
  channel: RealtimeChannel
  listeners: Set<() => void>
  timer: ReturnType<typeof setTimeout> | null
}

const canales = new Map<string, CanalCompartido>()

const ESPERA_MS = 400

export function escucharAvisos(topic: string, privado: boolean, onCambio: () => void): () => void {
  let canal = canales.get(topic)

  if (!canal) {
    const listeners = new Set<() => void>()
    const nuevo: CanalCompartido = {
      listeners,
      timer: null,
      channel: supabase.channel(topic, { config: { private: privado } }),
    }
    nuevo.channel
      .on('broadcast', { event: 'cambio' }, () => {
        if (nuevo.timer) clearTimeout(nuevo.timer)
        nuevo.timer = setTimeout(() => {
          nuevo.timer = null
          for (const listener of [...listeners]) listener()
        }, ESPERA_MS)
      })
      .subscribe()
    canales.set(topic, nuevo)
    canal = nuevo
  }

  const actual = canal
  actual.listeners.add(onCambio)

  return () => {
    actual.listeners.delete(onCambio)
    if (actual.listeners.size === 0) {
      if (actual.timer) clearTimeout(actual.timer)
      canales.delete(topic)
      supabase.removeChannel(actual.channel)
    }
  }
}

export function suscribirseAlPanelStaff(onCambio: () => void): () => void {
  return escucharAvisos('staff-panel', true, onCambio)
}

export function suscribirseAExplorar(onCambio: () => void): () => void {
  return escucharAvisos('explorar', false, onCambio)
}
