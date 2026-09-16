import { StyleSheet, View } from 'react-native'

import { colors } from '@/theme/colors'
import type { UserStatus } from '@/lib/types'

const statusColor: Record<UserStatus, string> = {
  online: colors.online,
  idle: colors.idle,
  dnd: colors.dnd,
  offline: colors.offline,
}

export function StatusDot({ status, size = 12 }: { status: UserStatus; size?: number }) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: statusColor[status],
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  dot: {
    borderWidth: 2,
    borderColor: colors.background,
  },
})
