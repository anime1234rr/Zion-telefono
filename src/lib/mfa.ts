import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'

export interface MfaFactor {
  id: string
  friendlyName: string | null
  status: string
  createdAt: string
}

export interface MfaEnrollment {
  factorId: string
  secret: string
  uri: string
}

export async function listarFactoresMfa(): Promise<MfaFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return (data?.all ?? []).filter((f) => f.factor_type === 'totp').map((f) => ({
    id: f.id,
    friendlyName: f.friendly_name ?? null,
    status: f.status,
    createdAt: f.created_at,
  }))
}

export async function limpiarFactoresSinVerificar(): Promise<void> {
  const factores = await listarFactoresMfa().catch(() => [] as MfaFactor[])
  for (const f of factores) {
    if (f.status !== 'verified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {})
    }
  }
}

export async function iniciarEnrolamientoMfa(baseName?: string): Promise<MfaEnrollment> {
  const factores = await listarFactoresMfa().catch(() => [] as MfaFactor[])

  for (const f of factores) {
    if (f.status !== 'verified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {})
    }
  }

  const usados = new Set(
    factores.filter((f) => f.status === 'verified').map((f) => (f.friendlyName ?? '').trim())
  )

  const base = (baseName ?? '').trim() || `Zion móvil ${new Date().toLocaleDateString()}`
  let nombre = base
  let intento = 2
  while (usados.has(nombre)) {
    nombre = `${base} (${intento})`
    intento += 1
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: nombre,
  })
  if (error) throw error
  return {
    factorId: data.id,
    secret: data.totp.secret,
    uri: data.totp.uri,
  }
}

export async function confirmarEnrolamientoMfa(factorId: string, code: string): Promise<void> {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
  if (challengeError) throw challengeError

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim(),
  })
  if (error) throw error
}

export async function quitarFactorMfa(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}

export async function necesitaVerificacionMfa(): Promise<boolean> {
  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aalError) throw aalError
  if (aal.currentLevel === 'aal2') return false

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return aal.nextLevel === 'aal2'
  return (data.user.factors ?? []).some((f) => f.factor_type === 'totp' && f.status === 'verified')
}

export async function verificarCodigoMfa(code: string): Promise<void> {
  const factores = await listarFactoresMfa()
  const factor = factores.find((f) => f.status === 'verified')
  if (!factor) throw new Error('No hay ninguna app de autenticación activa en esta cuenta.')
  await confirmarEnrolamientoMfa(factor.id, code)
}

let canalCambiosMfa: RealtimeChannel | null = null

export function suscribirseACambiosMfa(userId: string, onCambio: () => void): () => void {
  const channel = supabase
    .channel(`mfa-sync-${userId}`)
    .on('broadcast', { event: 'cambio' }, () => onCambio())
    .subscribe()
  canalCambiosMfa = channel

  return () => {
    if (canalCambiosMfa === channel) canalCambiosMfa = null
    supabase.removeChannel(channel)
  }
}

export function avisarCambioMfa(): void {
  canalCambiosMfa
    ?.send({ type: 'broadcast', event: 'cambio', payload: {} })
    .catch(() => {})
}
