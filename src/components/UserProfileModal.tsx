import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Avatar } from '@/components/Avatar'
import {
  aceptarSolicitudAmistad,
  enviarSolicitudAmistad,
  obtenerRelacionAmistad,
} from '@/lib/friends'
import { obtenerPerfilPublico, type PublicProfile } from '@/lib/profiles'
import { getErrorMessage } from '@/lib/utils'
import { formatFullDate } from '@/lib/internal/core-utils'
import { ErrorBoundary } from '@/lib/internal/perf-metrics'
import type { FriendStatus, UserStatus } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const statusLabel: Record<UserStatus, string> = {
  online: 'Conectado',
  idle: 'Ausente',
  dnd: 'No molestar',
  offline: 'Desconectado',
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
  const [friendRequestError, setFriendRequestError] = useState<string | null>(null)
  const [relacion, setRelacion] = useState<{ id: string; status: FriendStatus } | null>(null)

  const isOwnProfile = userId === currentUserId

  useEffect(() => {
    if (!visible || !userId || userId === currentUserId) return
    let cancelado = false
    obtenerRelacionAmistad(currentUserId, userId)
      .then((rel) => !cancelado && setRelacion(rel))
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [visible, userId, currentUserId])

  useEffect(() => {
    if (!visible || !userId) return
    let cancelado = false
    setLoading(true)
    setError(null)
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
      const rel = await obtenerRelacionAmistad(currentUserId, userId)
      setRelacion(rel ?? { id: '', status: 'pendiente_enviada' })
    } catch (err) {
      setFriendRequestError(getErrorMessage(err))
    }
  }

  async function handleAcceptFriend() {
    if (!userId || !relacion) return
    setFriendRequestError(null)
    try {
      await aceptarSolicitudAmistad(relacion.id)
      setRelacion({ ...relacion, status: 'aceptada' })
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
            <ErrorBoundary label="UserProfileModal" fallbackMessage="No se pudo mostrar este perfil.">
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

                <Text style={styles.memberSince}>Miembro desde {formatFullDate(profile.creadoAt)}</Text>

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
                      {relacion?.status === 'aceptada' || relacion?.status === 'bloqueada' ? null : relacion?.status ===
                        'pendiente_enviada' ? (
                        <View style={[styles.secondaryButton, styles.secondaryButtonMuted]}>
                          <Ionicons name="checkmark" size={16} color={colors.mutedForeground} />
                          <Text style={styles.secondaryButtonMutedLabel}>Enviada</Text>
                        </View>
                      ) : relacion?.status === 'pendiente_recibida' ? (
                        <Pressable style={styles.secondaryButton} onPress={handleAcceptFriend}>
                          <Ionicons name="checkmark" size={16} color={colors.foreground} />
                          <Text style={styles.secondaryButtonLabel}>Aceptar</Text>
                        </Pressable>
                      ) : (
                        <Pressable style={styles.secondaryButton} onPress={handleAddFriend}>
                          <Ionicons name="person-add-outline" size={16} color={colors.foreground} />
                          <Text style={styles.secondaryButtonLabel}>Agregar</Text>
                        </Pressable>
                      )}
                    </>
                  )}
                </View>

                {friendRequestError ? <Text style={styles.error}>{friendRequestError}</Text> : null}
              </View>
            </ErrorBoundary>
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
  secondaryButtonMuted: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonMutedLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
})
