import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL as string).trim()
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string).trim()

const oyentesMfa = new Set<() => void>()

export function alRequerirMfa(oyente: () => void): () => void {
  oyentesMfa.add(oyente)
  return () => oyentesMfa.delete(oyente)
}

async function fetchConControlMfa(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const respuesta = await fetch(input, init)
  if ((respuesta.status === 401 || respuesta.status === 403) && String(input).includes('/rest/v1/')) {
    respuesta
      .clone()
      .json()
      .then((cuerpo: { hint?: string } | null) => {
        if (cuerpo?.hint === 'mfa_requerida') for (const oyente of oyentesMfa) oyente()
      })
      .catch(() => {})
  }
  return respuesta
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchConControlMfa },
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
