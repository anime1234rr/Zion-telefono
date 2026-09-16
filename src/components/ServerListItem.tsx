import { memo } from 'react'
import { Image } from 'expo-image'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import type { ServerItem } from '@/lib/types'

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export const ServerListItem = memo(function ServerListItem({
  server,
  active,
  onPress,
  onLongPress,
}: {
  server: ServerItem
  active?: boolean
  onPress: () => void
  onLongPress?: () => void
}) {
  return (
    <Pressable style={styles.wrapper} onPress={onPress} onLongPress={onLongPress} delayLongPress={280}>
      <View style={[styles.indicator, active && styles.indicatorActive]} />
      <View>
        {server.iconUrl ? (
          <Image source={{ uri: server.iconUrl }} style={[styles.icon, active && styles.iconActive]} />
        ) : (
          <View style={[styles.icon, styles.iconFallback, active && styles.iconActive]}>
            <Text style={styles.iconLabel}>{initials(server.name)}</Text>
          </View>
        )}
        {server.mentionCount ? (
          <View style={styles.mentionBadge}>
            <Text style={styles.mentionBadgeText}>
              {server.mentionCount > 99 ? '99+' : server.mentionCount}
            </Text>
          </View>
        ) : server.unread ? (
          <View style={styles.unreadDot} />
        ) : null}
      </View>
    </Pressable>
  )
})

export function ServerHomeButton({ active, onPress }: { active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <View style={[styles.indicator, active && styles.indicatorActive]} />
      <View style={[styles.icon, styles.iconFallback, active && styles.iconActive]}>
        <Text style={styles.iconLabel}>Z</Text>
      </View>
    </Pressable>
  )
}

const SIZE = 52

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  indicator: {
    width: 4,
    height: 8,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginRight: spacing.xs,
  },
  indicatorActive: {
    height: SIZE * 0.6,
    backgroundColor: colors.foreground,
  },
  icon: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.xl,
  },
  iconActive: {
    borderRadius: radius.md,
  },
  iconFallback: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: fontSize.md,
  },
  unreadDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.foreground,
    borderWidth: 2,
    borderColor: colors.sidebar,
  },
  mentionBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.sidebar,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionBadgeText: {
    color: colors.primaryForeground,
    fontSize: 10,
    fontWeight: '700',
  },
})
