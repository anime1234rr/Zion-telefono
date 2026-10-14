import { StyleSheet, View } from 'react-native'

import { useAppSettings } from '@/lib/app-settings'
import { colors } from '@/theme/colors'
import type { UserStatus } from '@/lib/types'

const statusColor: Record<UserStatus, string> = {
  online: colors.online,
  idle: colors.idle,
  dnd: colors.dnd,
  offline: colors.offline,
}

const statusShape: Record<UserStatus, { borderRadius: (size: number) => number; rotate?: string }> = {
  online: { borderRadius: (size) => size / 2 },
  idle: { borderRadius: (size) => size / 4 },
  dnd: { borderRadius: (size) => size / 6, rotate: '45deg' },
  offline: { borderRadius: (size) => size / 2 },
}

export function StatusDot({ status, size = 12 }: { status: UserStatus; size?: number }) {
  const { indicadoresConForma } = useAppSettings()
  const forma = statusShape[status]
  const esHueco = indicadoresConForma && status === 'offline'

  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: indicadoresConForma ? forma.borderRadius(size) : size / 2,
          backgroundColor: esHueco ? 'transparent' : statusColor[status],
          borderColor: esHueco ? statusColor[status] : colors.background,
          transform: indicadoresConForma && forma.rotate ? [{ rotate: forma.rotate }] : undefined,
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
