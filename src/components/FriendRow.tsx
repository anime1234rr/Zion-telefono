import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Avatar } from '@/components/Avatar'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'
import type { Friend } from '@/lib/types'

const statusLabel: Record<Friend['status'], string> = {
  aceptada: 'Amigos',
  pendiente_enviada: 'Solicitud enviada',
  pendiente_recibida: 'Solicitud recibida',
  bloqueada: 'Bloqueado',
}

export function FriendRow({
  friend,
  onPress,
  rightSlot,
}: {
  friend: Friend
  onPress?: () => void
  rightSlot?: ReactNode
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar name={friend.user.name} url={friend.user.avatarUrl} status={friend.user.status} size={40} />
      <View style={styles.info}>
        <Text style={styles.name}>{friend.user.name}</Text>
        <Text style={styles.status}>{statusLabel[friend.status]}</Text>
      </View>
      {rightSlot}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  status: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
})
