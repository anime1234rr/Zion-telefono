import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/use-auth'
import { showAppAlert } from '@/hooks/use-app-alert'
import { actualizarAvatar, actualizarPerfil, obtenerPerfilEditable, type EditableProfile } from '@/lib/profiles'
import { subirAvatar } from '@/lib/storage'
import { getErrorMessage } from '@/lib/utils'
import type { UserStatus } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const STATUS_OPTIONS: { value: UserStatus; label: string }[] = [
  { value: 'online', label: 'En línea' },
  { value: 'idle', label: 'Ausente' },
  { value: 'dnd', label: 'No molestar' },
  { value: 'offline', label: 'Invisible' },
]

export function ProfileScreen() {
  const { user, signOut } = useAuth()
  const userId = user?.id ?? null
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [profile, setProfile] = useState<EditableProfile | null>(null)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [biografia, setBiografia] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      obtenerPerfilEditable(userId)
        .then((data) => {
          setProfile(data)
          setNombreCompleto(data.nombreCompleto)
          setBiografia(data.biografia)
        })
        .catch((err) => console.error('No se pudo cargar el perfil', err))
    }, [userId])
  )

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      const updated = await actualizarPerfil(user.id, { nombreCompleto, biografia })
      setProfile(updated)
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleChangeStatus(status: UserStatus) {
    if (!user) return
    try {
      const updated = await actualizarPerfil(user.id, { status })
      setProfile(updated)
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    }
  }

  async function handleChangeAvatar() {
    if (!user) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setUploadingAvatar(true)
    try {
      const url = await subirAvatar(user.id, {
        uri: asset.uri,
        name: asset.fileName ?? `avatar.${asset.uri.split('.').pop()}`,
        type: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      })
      await actualizarAvatar(user.id, url)
      setProfile((prev) => (prev ? { ...prev, avatarUrl: url } : prev))
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setUploadingAvatar(false)
    }
  }

  function handleSignOut() {
    showAppAlert('Cerrar sesión', '¿Seguro que querés cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Mi perfil</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarWrapper}>
          <Pressable onPress={handleChangeAvatar} disabled={uploadingAvatar}>
            <Avatar name={profile?.nombreUsuario ?? '?'} url={profile?.avatarUrl} size={88} />
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Ionicons name="camera-outline" size={14} color={colors.primaryForeground} />
              )}
            </View>
          </Pressable>
          <Text style={styles.username}>@{profile?.nombreUsuario}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Estado</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.statusChip, profile?.status === option.value && styles.statusChipActive]}
                onPress={() => handleChangeStatus(option.value)}
              >
                <Text
                  style={[
                    styles.statusChipLabel,
                    profile?.status === option.value && styles.statusChipLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre para mostrar</Text>
          <TextInput
            style={styles.input}
            value={nombreCompleto}
            onChangeText={setNombreCompleto}
            placeholder={profile?.nombreUsuario}
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Biografía</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={biografia}
            onChangeText={setBiografia}
            placeholder="Contá algo sobre vos"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            textAlignVertical="top"
            autoCorrect={false}
            spellCheck={false}
            underlineColorAndroid="transparent"
            multiline
          />
        </View>

        <Pressable style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.saveLabel}>Guardar cambios</Text>
          )}
        </Pressable>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={styles.signOutLabel}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
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
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  username: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statusChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  statusChipLabelActive: {
    color: colors.primaryForeground,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.destructive,
    paddingVertical: spacing.md,
  },
  signOutLabel: {
    color: colors.destructive,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
