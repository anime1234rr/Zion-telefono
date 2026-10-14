import { useSyncExternalStore } from 'react'

import { escribirJSON, leerJSON } from '@/lib/local-store'

export interface AppSettings {
  echoCancellation: boolean
  noiseSuppression: boolean
  autoGainControl: boolean
  reduceMotion: boolean
  subrayarEnlaces: boolean
  indicadoresConForma: boolean
}

const CLAVE = 'zion:app-settings'

const DEFAULTS: AppSettings = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  reduceMotion: false,
  subrayarEnlaces: false,
  indicadoresConForma: false,
}

let ajustes: AppSettings = DEFAULTS
let hidratado = false
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

async function hidratar() {
  if (hidratado) return
  hidratado = true
  const guardado = await leerJSON<Partial<AppSettings>>(CLAVE, {})
  ajustes = { ...DEFAULTS, ...guardado }
  emit()
}

void hidratar()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  void hidratar()
  return () => listeners.delete(listener)
}

export function getAppSettings(): AppSettings {
  return ajustes
}

export function setAppSetting<K extends keyof AppSettings>(clave: K, valor: AppSettings[K]): void {
  ajustes = { ...ajustes, [clave]: valor }
  emit()
  void escribirJSON(CLAVE, ajustes)
}

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(subscribe, () => ajustes, () => DEFAULTS)
}
