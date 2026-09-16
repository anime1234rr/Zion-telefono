import { borrarClave, borrarClaves, clavesConPrefijo, escribirJSON, leerJSON } from '@/lib/local-store'
import type { ChatMessage } from '@/lib/types'

const MAX_MENSAJES_CACHE = 80
const MAX_CANALES_CACHE = 60
const PREFIJO = 'zion:msgcache:'

interface CacheEntry {
  messages: ChatMessage[]
  updatedAt: number
}

export function claveCanal(channelId: string): string {
  return `channel:${channelId}`
}

export function claveDM(conversationId: string): string {
  return `dm:${conversationId}`
}

export async function leerMensajesDeCache(key: string): Promise<ChatMessage[]> {
  const entry = await leerJSON<CacheEntry | null>(PREFIJO + key, null)
  return entry?.messages ?? []
}

export async function guardarMensajesEnCache(key: string, messages: ChatMessage[]): Promise<void> {
  await escribirJSON(PREFIJO + key, {
    messages: messages.slice(-MAX_MENSAJES_CACHE),
    updatedAt: Date.now(),
  })
  await podarCache()
}

export async function olvidarCacheDeCanal(key: string): Promise<void> {
  await borrarClave(PREFIJO + key)
}

async function podarCache(): Promise<void> {
  const claves = await clavesConPrefijo(PREFIJO)
  if (claves.length <= MAX_CANALES_CACHE) return

  const conFecha = await Promise.all(
    claves.map(async (k) => {
      const entry = await leerJSON<CacheEntry | null>(k, null)
      return { k, updatedAt: entry?.updatedAt ?? 0 }
    })
  )
  conFecha.sort((a, b) => a.updatedAt - b.updatedAt)
  const sobrantes = conFecha.slice(0, claves.length - MAX_CANALES_CACHE).map((x) => x.k)
  await borrarClaves(sobrantes)
}
