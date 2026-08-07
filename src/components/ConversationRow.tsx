import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Avatar } from '@/components/Avatar'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import type { DMConversation } from '@/lib/types'

export function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: DMConversation
  onPress: () => void
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar
        name={conversation.otherUser.name}
        url={conversation.otherUser.avatarUrl}
        status={conversation.otherUser.status}
        size={44}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{conversation.otherUser.name}</Text>
        <Text style={styles.preview} numberOfLines={1}>
          {conversation.lastMessagePreview ?? 'Sin mensajes todavía'}
        </Text>
      </View>
      {conversation.unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{conversation.unreadCount}</Text>
        </View>
      ) : null}
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
  preview: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.primaryForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
})
