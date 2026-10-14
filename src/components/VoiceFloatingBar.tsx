import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { leaveVoiceChannel, toggleDeafen, toggleMute, useVoiceConnection } from '@/hooks/use-voice-connection'
import { navigationRef } from '@/lib/navigation-ref'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function VoiceFloatingBar({ hidden }: { hidden: boolean }) {
  const { connectedChannelId, connectedChannelName, muted, deafened } = useVoiceConnection()
  const insets = useSafeAreaInsets()

  if (!connectedChannelId || hidden) return null

  function handleReturn() {
    if (!connectedChannelId || !connectedChannelName) return
    navigationRef.navigate('VoiceChannel', { channelId: connectedChannelId, channelName: connectedChannelName })
  }

  return (
    <View style={[styles.container, { bottom: insets.bottom + spacing.sm }]}>
      <Pressable style={styles.info} onPress={handleReturn}>
        <View style={styles.dot} />
        <Text style={styles.name} numberOfLines={1}>
          {connectedChannelName ?? 'Canal de voz'}
        </Text>
        <Ionicons name="chevron-up-circle" size={18} color={colors.mutedForeground} />
      </Pressable>
      <View style={styles.actions}>
        <Pressable style={[styles.actionButton, muted && styles.actionButtonActive]} onPress={() => void toggleMute()}>
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={18} color={muted ? colors.destructive : colors.foreground} />
        </Pressable>
        <Pressable style={[styles.actionButton, deafened && styles.actionButtonActive]} onPress={() => void toggleDeafen()}>
          <Ionicons
            name={deafened ? 'volume-mute' : 'volume-high'}
            size={18}
            color={deafened ? colors.destructive : colors.foreground}
          />
        </Pressable>
        <Pressable style={[styles.actionButton, styles.leaveButton]} onPress={() => void leaveVoiceChannel()}>
          <Ionicons name="call" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.online,
  },
  name: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  actionButtonActive: {
    backgroundColor: alfa(colors.destructive, 0.16),
  },
  leaveButton: {
    backgroundColor: colors.destructive,
    transform: [{ rotate: '135deg' }],
  },
})
