import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/use-auth'
import { useVoiceSession } from '@/hooks/use-voice-session'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function VoiceRoomInner({
  channelId,
  channelName,
}: {
  channelId: string
  channelName: string
}) {
  const navigation = useNavigation()
  const { user } = useAuth()
  const { participants, muted, deafened, connecting, error, toggleMute, toggleDeafen } =
    useVoiceSession(channelId, user?.id ?? null)

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Ionicons name="volume-high" size={16} color={colors.mutedForeground} />
          <Text style={styles.title} numberOfLines={1}>
            {channelName}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      {error ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : connecting ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.hint}>Conectando a la sala…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {participants.length === 0 ? (
            <Text style={styles.hint}>Todavía no hay nadie más en la sala.</Text>
          ) : (
            participants.map((p) => (
              <View key={p.user.id} style={styles.tile}>
                <Avatar name={p.user.name} url={p.user.avatarUrl} size={64} />
                <Text style={styles.tileName} numberOfLines={1}>
                  {p.user.id === user?.id ? 'Vos' : p.user.name}
                </Text>
                <View style={styles.tileIcons}>
                  {p.deafened ? (
                    <Ionicons name="volume-mute" size={14} color={colors.destructive} />
                  ) : p.muted ? (
                    <Ionicons name="mic-off" size={14} color={colors.destructive} />
                  ) : (
                    <Ionicons name="mic" size={14} color={colors.online} />
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <View style={styles.controls}>
        <Pressable
          style={[styles.controlButton, muted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Ionicons
            name={muted ? 'mic-off' : 'mic'}
            size={22}
            color={muted ? colors.destructive : colors.foreground}
          />
        </Pressable>
        <Pressable
          style={[styles.controlButton, deafened && styles.controlButtonActive]}
          onPress={toggleDeafen}
        >
          <Ionicons
            name={deafened ? 'volume-mute' : 'volume-high'}
            size={22}
            color={deafened ? colors.destructive : colors.foreground}
          />
        </Pressable>
        <Pressable
          style={[styles.controlButton, styles.leaveButton]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="call" size={22} color="#ffffff" />
        </Pressable>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  errorText: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  grid: {
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    padding: spacing.lg,
    alignContent: 'flex-start',
  },
  tile: {
    width: 96,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  tileName: {
    color: colors.foreground,
    fontSize: fontSize.xs,
    fontWeight: '600',
    maxWidth: 84,
  },
  tileIcons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  leaveButton: {
    backgroundColor: colors.destructive,
    transform: [{ rotate: '135deg' }],
  },
})
