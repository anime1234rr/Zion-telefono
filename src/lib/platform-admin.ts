import { supabase } from '@/lib/supabase'

export async function esAdminPlataforma(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('soy_admin_plataforma')
    if (error) return false
    return data === true
  } catch {
    return false
  }
}
