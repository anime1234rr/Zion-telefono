import { useSyncExternalStore } from 'react'

import { escribirJSON, leerJSON } from '@/lib/local-store'
import type { ChatMessage } from '@/lib/types'

export interface SavedMessageRow {
  id: string
  scope: 'canal' | 'dm'
  serverId: string | null
  serverName: string | null
  channelId: string | null
  channelName: string | null
  conversationId: string | null
  authorName: string
  preview: string
  link: string | null
  savedAt: number
}

const KEY = 'zion:saved-messages'

let filas: SavedMessageRow[] = []
let ids = new Set<string>()
let hidratado = false
const listeners = new Set<() => void>()

function emit() {
  ids = new Set(ids)
  for (const listener of listeners) listener()
}

async function persistir() {
  await escribirJSON(KEY, filas)
}

async function hidratar() {
  if (hidratado) return
  hidratado = true
  filas = await leerJSON<SavedMessageRow[]>(KEY, [])
  ids = new Set(filas.map((f) => f.id))
  emit()
}

void hidratar()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  void hidratar()
  return () => listeners.delete(listener)
}

function previewDeMensaje(message: ChatMessage): string {
  if (message.content?.trim()) return message.content.trim().slice(0, 200)
  if (message.code?.code?.trim()) return message.code.code.trim().slice(0, 200)
  if (message.attachment) return `[${message.attachment.type}]`
  return '[mensaje]'
}

export interface SaveMessageContext {
  scope: 'canal' | 'dm'
  serverId?: string | null
  serverName?: string | null
  channelId?: string | null
  channelName?: string | null
  conversationId?: string | null
  link?: string | null
}

export async function alternarMensajeGuardado(
  message: ChatMessage,
  contexto: SaveMessageContext
): Promise<boolean> {
  await hidratar()
  if (ids.has(message.id)) {
    filas = filas.filter((f) => f.id !== message.id)
    ids.delete(message.id)
    emit()
    await persistir()
    return false
  }

  const row: SavedMessageRow = {
    id: message.id,
    scope: contexto.scope,
    serverId: contexto.serverId ?? null,
    serverName: contexto.serverName ?? null,
    channelId: contexto.channelId ?? null,
    channelName: contexto.channelName ?? null,
    conversationId: contexto.conversationId ?? null,
    authorName: message.author.name || 'Alguien',
    preview: previewDeMensaje(message),
    link: contexto.link ?? null,
    savedAt: Date.now(),
  }
  filas = [...filas, row]
  ids.add(message.id)
  emit()
  await persistir()
  return true
}

export async function quitarMensajeGuardado(messageId: string): Promise<void> {
  await hidratar()
  filas = filas.filter((f) => f.id !== messageId)
  ids.delete(messageId)
  emit()
  await persistir()
}

export async function listarMensajesGuardados(): Promise<SavedMessageRow[]> {
  await hidratar()
  return [...filas].sort((a, b) => b.savedAt - a.savedAt)
}

export function useMensajeGuardado(messageId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => ids.has(messageId),
    () => false
  )
}

export function useCantidadMensajesGuardados(): number {
  return useSyncExternalStore(
    subscribe,
    () => ids.size,
    () => 0
  )
}
