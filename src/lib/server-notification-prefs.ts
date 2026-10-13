import { useSyncExternalStore } from 'react'

import { supabase } from '@/lib/supabase'

import { escribirJSON, leerJSON } from '@/lib/local-store'

export type ServerAlertLevel = 'todas' | 'menciones' | 'nada'
export type ChannelAlertLevel = ServerAlertLevel | 'heredar'

export interface ServerNotifPref {
  level: ServerAlertLevel
  muted: boolean
}

export const DEFAULT_SERVER_NOTIF_PREF: ServerNotifPref = {
  level: 'todas',
  muted: false,
}

const SERVER_KEY = 'zion:server-notif-prefs'
const CHANNEL_KEY = 'zion:channel-notif-prefs'
const LEVELS: ServerAlertLevel[] = ['todas', 'menciones', 'nada']
const CHANNEL_LEVELS: ChannelAlertLevel[] = ['todas', 'menciones', 'nada', 'heredar']

type ServerPrefMap = Record<string, ServerNotifPref>
type ChannelPrefMap = Record<string, ChannelAlertLevel>

let serverPrefs: ServerPrefMap = {}
let channelPrefs: ChannelPrefMap = {}
let hidratado = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

async function hidratar() {
  if (hidratado) return
  hidratado = true
  const [rawServer, rawChannel] = await Promise.all([
    leerJSON<Record<string, Partial<ServerNotifPref>>>(SERVER_KEY, {}),
    leerJSON<Record<string, ChannelAlertLevel>>(CHANNEL_KEY, {}),
  ])

  const nextServer: ServerPrefMap = {}
  for (const [id, value] of Object.entries(rawServer)) {
    nextServer[id] = {
      level: value.level && LEVELS.includes(value.level) ? value.level : 'todas',
      muted: Boolean(value.muted),
    }
  }
  const nextChannel: ChannelPrefMap = {}
  for (const [id, value] of Object.entries(rawChannel)) {
    if (CHANNEL_LEVELS.includes(value)) nextChannel[id] = value
  }

  serverPrefs = nextServer
  channelPrefs = nextChannel
  emit()
}

void hidratar()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  void hidratar()
  return () => listeners.delete(listener)
}

function persistServer() {
  serverPrefs = { ...serverPrefs }
  emit()
  void escribirJSON(SERVER_KEY, serverPrefs)
}

function persistChannel() {
  channelPrefs = { ...channelPrefs }
  emit()
  void escribirJSON(CHANNEL_KEY, channelPrefs)
}

async function usuarioActual(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user.id ?? null
}

async function sincronizarServidor(serverId: string): Promise<void> {
  const usuarioId = await usuarioActual()
  if (!usuarioId) return
  const pref = serverPrefs[serverId]
  if (!pref) {
    await supabase
      .from('preferencias_notificacion_servidor')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('servidor_id', serverId)
    return
  }
  await supabase.from('preferencias_notificacion_servidor').upsert({
    usuario_id: usuarioId,
    servidor_id: serverId,
    nivel: pref.level,
    silenciado: pref.muted,
    actualizado_at: new Date().toISOString(),
  })
}

async function sincronizarCanal(channelId: string): Promise<void> {
  const usuarioId = await usuarioActual()
  if (!usuarioId) return
  const nivel = channelPrefs[channelId]
  if (!nivel || nivel === 'heredar') {
    await supabase
      .from('preferencias_notificacion_canal')
      .delete()
      .eq('usuario_id', usuarioId)
      .eq('canal_id', channelId)
    return
  }
  await supabase.from('preferencias_notificacion_canal').upsert({
    usuario_id: usuarioId,
    canal_id: channelId,
    nivel,
    actualizado_at: new Date().toISOString(),
  })
}

export async function sincronizarPreferenciasNotificacion(): Promise<void> {
  await hidratar()
  await Promise.all([
    ...Object.keys(serverPrefs).map((id) => sincronizarServidor(id).catch(() => {})),
    ...Object.keys(channelPrefs).map((id) => sincronizarCanal(id).catch(() => {})),
  ])
}

export function getServerNotifPref(serverId: string): ServerNotifPref {
  return serverPrefs[serverId] ?? DEFAULT_SERVER_NOTIF_PREF
}

export function setServerAlertLevel(serverId: string, level: ServerAlertLevel): void {
  serverPrefs[serverId] = { ...getServerNotifPref(serverId), level }
  persistServer()
  void sincronizarServidor(serverId).catch(() => {})
}

export function setServerMuted(serverId: string, muted: boolean): void {
  serverPrefs[serverId] = { ...getServerNotifPref(serverId), muted }
  persistServer()
  void sincronizarServidor(serverId).catch(() => {})
}

export function toggleServerMuted(serverId: string): void {
  setServerMuted(serverId, !getServerNotifPref(serverId).muted)
}

export function olvidarServerNotifPref(serverId: string): void {
  if (!(serverId in serverPrefs)) return
  delete serverPrefs[serverId]
  persistServer()
  void sincronizarServidor(serverId).catch(() => {})
}

export function getChannelNotifLevel(channelId: string): ChannelAlertLevel {
  return channelPrefs[channelId] ?? 'heredar'
}

export function setChannelNotifLevel(channelId: string, level: ChannelAlertLevel): void {
  if (level === 'heredar') {
    olvidarChannelNotifPref(channelId)
    return
  }
  channelPrefs[channelId] = level
  persistChannel()
  void sincronizarCanal(channelId).catch(() => {})
}

export function olvidarChannelNotifPref(channelId: string): void {
  if (!(channelId in channelPrefs)) return
  delete channelPrefs[channelId]
  persistChannel()
  void sincronizarCanal(channelId).catch(() => {})
}

function nivelPermiteTipo(level: ServerAlertLevel, tipo: string): boolean {
  if (level === 'nada') return false
  if (level === 'menciones') return tipo === 'mencion'
  return true
}

export function debeAlertarNotificacion(
  notificacion: { servidorId: string | null; tipo: string },
  canalId?: string | null
): boolean {
  if (!notificacion.servidorId) return true

  const pref = getServerNotifPref(notificacion.servidorId)
  if (pref.muted) return false

  const canalLevel = canalId ? getChannelNotifLevel(canalId) : 'heredar'
  const efectivo = canalLevel === 'heredar' ? pref.level : canalLevel
  return nivelPermiteTipo(efectivo, notificacion.tipo)
}

export function useServerNotifPref(serverId: string): ServerNotifPref {
  return useSyncExternalStore(
    subscribe,
    () => serverPrefs[serverId] ?? DEFAULT_SERVER_NOTIF_PREF,
    () => DEFAULT_SERVER_NOTIF_PREF
  )
}

export function useChannelNotifLevel(channelId: string): ChannelAlertLevel {
  return useSyncExternalStore(
    subscribe,
    () => channelPrefs[channelId] ?? 'heredar',
    () => 'heredar'
  )
}
