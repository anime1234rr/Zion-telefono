import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import { AuthContext, type PendingAuthAction } from '@/lib/auth-context-core'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingAuthAction, setPendingAuthAction] = useState<PendingAuthAction>(null)

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

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut,
        pendingAuthAction,
        setPendingAuthAction,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
