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
  return (data?.totp ?? []).map((f) => ({
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
