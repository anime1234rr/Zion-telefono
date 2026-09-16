import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'

export type PendingAuthAction =
  | { type: 'recovery'; email?: string }
  | { type: 'invite'; email?: string }
  | null

export interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  pendingAuthAction: PendingAuthAction
  setPendingAuthAction: (action: PendingAuthAction) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
