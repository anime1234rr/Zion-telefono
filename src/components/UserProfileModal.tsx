import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Avatar } from '@/components/Avatar'
import { enviarSolicitudAmistad } from '@/lib/friends'
import { obtenerPerfilPublico, type PublicProfile } from '@/lib/profiles'
import { getErrorMessage } from '@/lib/utils'
import type { UserStatus } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const statusLabel: Record<UserStatus, string> = {
  online: 'Conectado',
  idle: 'Ausente',
  dnd: 'No molestar',
  offline: 'Desconectado',
}

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function UserProfileModal({
  userId,
  currentUserId,
  visible,
  onClose,
  onMessageUser,
}: {
  userId: string | null
  currentUserId: string
  visible: boolean
  onClose: () => void
  onMessageUser?: (userId: string) => void
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [friendRequestSent, setFriendRequestSent] = useState(false)
  const [friendRequestError, setFriendRequestError] = useState<string | null>(null)

  const isOwnProfile = userId === currentUserId

  useEffect(() => {
    if (!visible || !userId) return
    let cancelado = false
    setLoading(true)
    setError(null)
    setFriendRequestSent(false)
    setFriendRequestError(null)

    obtenerPerfilPublico(userId)
      .then((data) => !cancelado && setProfile(data))
      .catch((err) => !cancelado && setError(getErrorMessage(err)))
      .finally(() => !cancelado && setLoading(false))

    return () => {
      cancelado = true
    }
  }, [visible, userId])

  async function handleAddFriend() {
    if (!userId) return
    setFriendRequestError(null)
    try {
      await enviarSolicitudAmistad(userId)
      setFriendRequestSent(true)
    } catch (err) {
      setFriendRequestError(getErrorMessage(err))
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.closeButton} onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.mutedForeground} />
          </Pressable>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : profile ? (
            <>
              <View
                style={[
                  styles.banner,
                  { backgroundColor: profile.bannerUrl ? undefined : profile.colorBanner },
                ]}
              />

              <View style={styles.body}>
                <View style={styles.avatarWrap}>
                  <Avatar
                    name={profile.nombreCompleto || profile.nombreUsuario}
                    url={profile.avatarUrl}
                    status={profile.status}
                    size={72}
                  />
                </View>

                <Text style={styles.name}>{profile.nombreCompleto || profile.nombreUsuario}</Text>
                <Text style={styles.username}>
                  @{profile.nombreUsuario} · {statusLabel[profile.status]}
                </Text>

                {profile.biografia ? <Text style={styles.bio}>{profile.biografia}</Text> : null}

                <Text style={styles.memberSince}>Miembro desde {formatFecha(profile.creadoAt)}</Text>

                <View style={styles.actions}>
                  {isOwnProfile ? (
                    <Pressable
                      style={styles.primaryButton}
                      onPress={() => {
                        onClose()
                        navigation.navigate('Profile')
                      }}
                    >
                      <Text style={styles.primaryButtonLabel}>Editar perfil</Text>
                    </Pressable>
                  ) : (
                    <>
                      {onMessageUser ? (
                        <Pressable
                          style={styles.secondaryButton}
                          onPress={() => {
                            onClose()
                            onMessageUser(userId as string)
                          }}
                        >
                          <Ionicons name="chatbubble-outline" size={16} color={colors.foreground} />
                          <Text style={styles.secondaryButtonLabel}>Mensaje</Text>
                        </Pressable>
                      ) : null}
                      <Pressable
                        style={styles.secondaryButton}
                        disabled={friendRequestSent}
                        onPress={handleAddFriend}
                      >
                        <Ionicons
                          name={friendRequestSent ? 'checkmark' : 'person-add-outline'}
                          size={16}
                          color={colors.foreground}
                        />
                        <Text style={styles.secondaryButtonLabel}>
                          {friendRequestSent ? 'Enviada' : 'Agregar'}
                        </Text>
                      </Pressable>
                    </>
                  )}
                </View>

                {friendRequestError ? <Text style={styles.error}>{friendRequestError}</Text> : null}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  centered: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  banner: {
    height: 72,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  avatarWrap: {
    marginTop: -36,
    marginBottom: spacing.sm,
  },
  name: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  username: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  bio: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    lineHeight: 20,
  },
  memberSince: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  primaryButtonLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonLabel: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
})
