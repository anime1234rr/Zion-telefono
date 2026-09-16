import { useEffect } from 'react'
import { Linking } from 'react-native'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { navigationRef } from '@/lib/navigation-ref'
import { getErrorMessage } from '@/lib/utils'
import type { PendingAuthAction } from '@/lib/auth-context-core'

export const AUTH_CALLBACK_URL = 'zion://auth-callback'

type AuthLinkType = 'signup' | 'invite' | 'recovery' | 'email_change' | 'magiclink' | 'email'

interface ParsedAuthLink {
  type: AuthLinkType | null
  tokenHash: string | null
  accessToken: string | null
  refreshToken: string | null
  email: string | null
}

function extractParams(url: string): URLSearchParams | null {
  const queryIndex = url.indexOf('?')
  const hashIndex = url.indexOf('#')
  const parts: string[] = []
  if (queryIndex !== -1) {
    parts.push(url.slice(queryIndex + 1, hashIndex !== -1 ? hashIndex : undefined))
  }
  if (hashIndex !== -1) {
    parts.push(url.slice(hashIndex + 1))
  }
  if (parts.length === 0) return null
  return new URLSearchParams(parts.join('&'))
}

export function parseAuthCallbackUrl(url: string): ParsedAuthLink | null {
  if (!url.startsWith('zion://auth-callback')) return null
  const params = extractParams(url)
  if (!params) return null

  return {
    type: (params.get('type') as AuthLinkType | null) ?? null,
    tokenHash: params.get('token_hash'),
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    email: params.get('email'),
  }
}

export function useAuthDeepLinks() {
  const { setPendingAuthAction } = useAuth()

  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url) return
      const parsed = parseAuthCallbackUrl(url)
      if (!parsed || !parsed.type) return

      const pendingForType: PendingAuthAction =
        parsed.type === 'recovery'
          ? { type: 'recovery', email: parsed.email ?? undefined }
          : parsed.type === 'invite'
            ? { type: 'invite', email: parsed.email ?? undefined }
            : null

      if (pendingForType) setPendingAuthAction(pendingForType)

      try {
        if (parsed.accessToken && parsed.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: parsed.accessToken,
            refresh_token: parsed.refreshToken,
          })
          if (error) throw error
        } else if (parsed.tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: parsed.tokenHash,
            type: parsed.type,
          })
          if (error) throw error
        } else {
          if (pendingForType) setPendingAuthAction(null)
          return
        }

        if (navigationRef.isReady()) {
          if (parsed.type === 'recovery') navigationRef.navigate('ResetPasswordConfirm')
          else if (parsed.type === 'invite') navigationRef.navigate('InviteAccept')
        }
      } catch (err) {
        if (pendingForType) setPendingAuthAction(null)
        console.error('No se pudo procesar el enlace de autenticación:', getErrorMessage(err))
      }
    }

    Linking.getInitialURL().then(handleUrl)
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url))

    return () => subscription.remove()
  }, [setPendingAuthAction])
}
