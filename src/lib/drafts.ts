import { borrarClave, leerTexto, escribirTexto } from '@/lib/local-store'

const PREFIJO = 'zion:draft:'

export function claveDraftCanal(channelId: string): string {
  return `channel:${channelId}`
}

export function claveDraftDM(conversationId: string): string {
  return `dm:${conversationId}`
}

export async function leerDraft(key: string): Promise<string> {
  return (await leerTexto(PREFIJO + key)) ?? ''
}

export async function guardarDraft(key: string, text: string): Promise<void> {
  if (text.trim()) {
    await escribirTexto(PREFIJO + key, text)
  } else {
    await borrarClave(PREFIJO + key)
  }
}
