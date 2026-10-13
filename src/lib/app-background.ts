import { useSyncExternalStore } from 'react'

import { actualizarFondoApp, obtenerFondoApp, type AppBackground } from '@/lib/profiles'

let fondo: AppBackground | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function aplicarFondo(nuevo: AppBackground | null): void {
  if (fondo?.url === nuevo?.url && fondo?.tipo === nuevo?.tipo) return
  fondo = nuevo
  emit()
}

export async function cargarFondo(userId: string): Promise<void> {
  aplicarFondo(await obtenerFondoApp(userId))
}

export async function guardarFondo(userId: string, nuevo: AppBackground | null): Promise<void> {
  await actualizarFondoApp(userId, nuevo)
  aplicarFondo(nuevo)
}

export function useAppBackground(): AppBackground | null {
  return useSyncExternalStore(subscribe, () => fondo, () => null)
}
