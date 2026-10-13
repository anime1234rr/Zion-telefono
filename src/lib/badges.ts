import { supabase } from '@/lib/supabase'
import { createCache, useCachedValue } from '@/lib/internal/local-cache'

export type Insignia = 'fundador' | 'core_dev' | 'frontend_dev' | 'moderador'

const PRIORIDAD: Insignia[] = ['fundador', 'core_dev', 'frontend_dev', 'moderador']

const insigniasCache = createCache<Insignia[]>({ ttlMs: 10 * 60_000 })

interface InsigniaRow {
  usuario_id: string
  insignia: Insignia
}

async function fetchInsigniasUsuario(userId: string): Promise<Insignia[]> {
  const { data, error } = await supabase.rpc('obtener_insignias', { p_usuario_ids: [userId] })
  if (error) throw error
  return ((data ?? []) as InsigniaRow[]).map((row) => row.insignia)
}

export function insigniaPrincipal(insignias: Insignia[] | undefined): Insignia | null {
  if (!insignias) return null
  for (const tipo of PRIORIDAD) {
    if (insignias.includes(tipo)) return tipo
  }
  return null
}

export function useInsigniaUsuario(userId: string | null): Insignia | null {
  const { value } = useCachedValue(insigniasCache, userId, () => fetchInsigniasUsuario(userId as string))
  return insigniaPrincipal(value)
}
