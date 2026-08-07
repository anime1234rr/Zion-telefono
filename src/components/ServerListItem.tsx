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

export function ServerListItem({
  server,
  active,
  onPress,
}: {
  server: ServerItem
  active?: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={styles.wrapper} onPress={onPress}>
      <View style={[styles.indicator, active && styles.indicatorActive]} />
      {server.iconUrl ? (
        <Image source={{ uri: server.iconUrl }} style={[styles.icon, active && styles.iconActive]} />
      ) : (
        <View style={[styles.icon, styles.iconFallback, active && styles.iconActive]}>
          <Text style={styles.iconLabel}>{initials(server.name)}</Text>
        </View>
      )}
    </Pressable>
  )
}

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
})
