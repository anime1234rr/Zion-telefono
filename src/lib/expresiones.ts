import { supabase } from '@/lib/supabase'

export type ExpresionTipo = 'emoji' | 'sticker'

export interface ServerExpresion {
  id: string
  servidorId: string
  nombre: string
  url: string
  tipo: ExpresionTipo
  creadoAt: string
}

interface ExpresionRow {
  id: string
  servidor_id: string
  nombre: string
  url: string
  tipo: string
  creado_at: string
}

function mapExpresion(row: ExpresionRow): ServerExpresion {
  return {
    id: row.id,
    servidorId: row.servidor_id,
    nombre: row.nombre,
    url: row.url,
    tipo: row.tipo === 'sticker' ? 'sticker' : 'emoji',
    creadoAt: row.creado_at,
  }
}

export async function listarExpresiones(servidorId: string): Promise<ServerExpresion[]> {
  const { data, error } = await supabase
    .from('expresiones_servidor')
    .select('*')
    .eq('servidor_id', servidorId)
    .order('creado_at', { ascending: true })
    .returns<ExpresionRow[]>()

  if (error) throw error
  return (data ?? []).map(mapExpresion)
}
