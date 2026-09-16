import { useCallback } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import type { RootStackParamList } from '@/navigation/types'

let seq = 0
const resolvers = new Map<number, (nonce: string | null) => void>()

export function resolveReauth(id: number, nonce: string | null): void {
  resolvers.get(id)?.(nonce)
  resolvers.delete(id)
}

export function useRequireReauth() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  return useCallback(
    (reason: string): Promise<string | null> => {
      const id = ++seq
      return new Promise((resolve) => {
        resolvers.set(id, resolve)
        navigation.navigate('Reauthenticate', { id, reason })
      })
    },
    [navigation]
  )
}
