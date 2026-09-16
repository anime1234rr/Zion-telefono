import { useSyncExternalStore } from 'react'

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

export function getServerNotifPref(serverId: string): ServerNotifPref {
  return serverPrefs[serverId] ?? DEFAULT_SERVER_NOTIF_PREF
}

export function setServerAlertLevel(serverId: string, level: ServerAlertLevel): void {
  serverPrefs[serverId] = { ...getServerNotifPref(serverId), level }
  persistServer()
}

export function setServerMuted(serverId: string, muted: boolean): void {
  serverPrefs[serverId] = { ...getServerNotifPref(serverId), muted }
  persistServer()
}

export function toggleServerMuted(serverId: string): void {
  setServerMuted(serverId, !getServerNotifPref(serverId).muted)
}

export function olvidarServerNotifPref(serverId: string): void {
  if (!(serverId in serverPrefs)) return
  delete serverPrefs[serverId]
  persistServer()
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
}

export function olvidarChannelNotifPref(channelId: string): void {
  if (!(channelId in channelPrefs)) return
  delete channelPrefs[channelId]
  persistChannel()
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
