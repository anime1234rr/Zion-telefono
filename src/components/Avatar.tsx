import { StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'

import { colors } from '@/theme/colors'
import type { UserStatus } from '@/lib/types'
import { StatusDot } from '@/components/StatusDot'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function Avatar({
  name,
  url,
  size = 40,
  status,
}: {
  name: string
  url?: string
  size?: number
  status?: UserStatus
}) {
  return (
    <View style={{ width: size, height: size }}>
      {url ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials(name)}</Text>
        </View>
      )}
      {status ? (
        <View style={styles.statusWrap}>
          <StatusDot status={status} size={Math.max(10, size * 0.28)} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primaryForeground,
    fontWeight: '600',
  },
  statusWrap: {
    position: 'absolute',
    right: -2,
    bottom: -2,
  },
})
