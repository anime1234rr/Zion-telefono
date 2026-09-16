import { supabase } from '@/lib/supabase'

const STATUS_URL = 'https://nlyarakldfwvjrasfrgp.supabase.co/functions/v1/Zion-status'
const SUPABASE_ANON_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string).trim()

export interface SystemStatus {
  isMaintenance: boolean
  bypass: boolean
}

async function tokenDeSesion(): Promise<string> {
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? SUPABASE_ANON_KEY
  } catch {
    return SUPABASE_ANON_KEY
  }
}

export async function verificarEstadoSistema(): Promise<SystemStatus> {
  const accessToken = await tokenDeSesion()

  const response = await fetch(STATUS_URL, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (response.status === 503) {
    return { isMaintenance: true, bypass: false }
  }

  const data = await response.json().catch(() => null)
  return {
    isMaintenance: data?.isMaintenance === true,
    bypass: data?.bypass === true,
  }
}
