import { supabase } from '@/lib/supabase'

export async function marcarCanalLeido(canalId: string): Promise<void> {
  const { error } = await supabase.rpc('marcar_canal_leido', { p_canal_id: canalId })
  if (error) throw error
}

export async function listarCanalesNoLeidos(
  servidorId: string
): Promise<Map<string, string | null>> {
  const { data, error } = await supabase.rpc('canales_no_leidos', { p_servidor_id: servidorId })
  if (error) throw error
  const filas = (data ?? []) as { canal_id: string; leido_hasta: string | null }[]
  return new Map(filas.map((row) => [row.canal_id, row.leido_hasta]))
}

export async function listarServidoresNoLeidos(): Promise<Set<string>> {
  const { data, error } = await supabase.rpc('servidores_no_leidos')
  if (error) throw error
  return new Set(((data ?? []) as { servidor_id: string }[]).map((row) => row.servidor_id))
}
