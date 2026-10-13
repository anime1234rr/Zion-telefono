import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import type { Session } from '@supabase/supabase-js'

import { alRequerirMfa, supabase } from '@/lib/supabase'
import { AuthContext, type PendingAuthAction } from '@/lib/auth-context-core'
import { necesitaVerificacionMfa, suscribirseACambiosMfa } from '@/lib/mfa'
import { desregistrarPush } from '@/lib/push'

const MFA_RECHECK_MS = 60_000

type MfaStatus = 'unknown' | 'ok' | 'required'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAuthAction, setPendingAuthAction] = useState<PendingAuthAction>(null)
  const [mfaStatus, setMfaStatus] = useState<MfaStatus>('unknown')
  const userId = session?.user.id ?? null
  const accessToken = session?.access_token ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession)
        setLoading(false)
        if (!nextSession) {
          setPendingAuthAction(null)
        } else if (event === 'PASSWORD_RECOVERY') {
          setPendingAuthAction({ type: 'recovery', email: nextSession.user.email })
        }
      }
    )

    return () => subscription.subscription.unsubscribe()
  }, [])

  const refreshMfa = useCallback(
    () =>
      necesitaVerificacionMfa().then(
        (requerida) => setMfaStatus(requerida ? 'required' : 'ok'),
        () => setMfaStatus((prev) => (prev === 'unknown' ? 'ok' : prev))
      ),
    []
  )

  const [mfaUserId, setMfaUserId] = useState<string | null>(null)
  if (mfaUserId !== userId) {
    setMfaUserId(userId)
    setMfaStatus('unknown')
  }

  useEffect(() => {
    if (!accessToken) return
    necesitaVerificacionMfa().then(
      (requerida) => setMfaStatus(requerida ? 'required' : 'ok'),
      () => setMfaStatus((prev) => (prev === 'unknown' ? 'ok' : prev))
    )
  }, [accessToken])

  useEffect(() => {
    if (!userId) return
    const unsubscribe = suscribirseACambiosMfa(userId, refreshMfa)
    const dejarDeEscucharApi = alRequerirMfa(refreshMfa)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshMfa()
    })
    const interval = setInterval(refreshMfa, MFA_RECHECK_MS)
    return () => {
      sub.remove()
      clearInterval(interval)
      unsubscribe()
      dejarDeEscucharApi()
    }
  }, [userId, refreshMfa])

  async function signOut() {
    await desregistrarPush().catch(() => {})
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading: loading || (!!userId && mfaStatus === 'unknown'),
        mfaRequired: !!userId && mfaStatus === 'required',
        refreshMfa,
        signOut,
        pendingAuthAction,
        setPendingAuthAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
