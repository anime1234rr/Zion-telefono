import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import type { ChannelItem } from '@/lib/types'

const iconByType: Record<ChannelItem['type'], keyof typeof Ionicons.glyphMap> = {
  text: 'chatbubble-outline',
  voice: 'volume-medium-outline',
  code: 'code-slash-outline',
  announcement: 'megaphone-outline',
}

export function ChannelListItem({
  channel,
  active,
  onPress,
}: {
  channel: ChannelItem
  active?: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={[styles.row, active && styles.rowActive]} onPress={onPress}>
      <Ionicons
        name={iconByType[channel.type]}
        size={18}
        color={active ? colors.foreground : colors.mutedForeground}
      />
      <Text style={[styles.name, active && styles.nameActive]} numberOfLines={1}>
        {channel.name}
      </Text>
      {channel.unread ? <View style={styles.unreadDot} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    marginHorizontal: spacing.sm,
  },
  rowActive: {
    backgroundColor: colors.secondary,
  },
  name: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: fontSize.md,
  },
  nameActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
})
