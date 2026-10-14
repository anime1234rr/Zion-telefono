import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/use-auth'
import { useStaffCaps } from '@/hooks/use-staff-caps'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  actualizarAvatar,
  actualizarBanner,
  actualizarPerfil,
  estadoPropioAStatus,
  obtenerPerfilEditable,
  type EditableProfile,
} from '@/lib/profiles'
import { suscribirseAMiPerfil } from '@/lib/presence'
import { subirAvatar, subirBanner } from '@/lib/storage'
import { getErrorMessage } from '@/lib/utils'
import { APP_VERSION, checkForUpdates } from '@/lib/updates'
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

const COLORES_BANNER = [
  '#6366f1',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#9ca3af',
]

export function ProfileScreen() {
  const { user, signOut } = useAuth()
  const userId = user?.id ?? null
  const staffCaps = useStaffCaps(user?.id)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [profile, setProfile] = useState<EditableProfile | null>(null)
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [biografia, setBiografia] = useState('')
  const [colorBanner, setColorBanner] = useState('#6366f1')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      obtenerPerfilEditable(userId)
        .then((data) => {
          setProfile(data)
          setNombreCompleto(data.nombreCompleto)
          setBiografia(data.biografia)
          setColorBanner(data.colorBanner)
        })
        .catch((err) => console.error('No se pudo cargar el perfil', err))

      return suscribirseAMiPerfil(userId, (row) => {
        setProfile((prev) => (prev ? { ...prev, status: estadoPropioAStatus(row.estado) } : prev))
      })
    }, [userId])
  )

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      const updated = await actualizarPerfil(user.id, { nombreCompleto, biografia, colorBanner })
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

  async function handleChangeBanner() {
    if (!user) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 1],
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setUploadingBanner(true)
    try {
      const url = await subirBanner(user.id, {
        uri: asset.uri,
        name: asset.fileName ?? `banner.${asset.uri.split('.').pop()}`,
        type: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize,
      })
      await actualizarBanner(user.id, url)
      setProfile((prev) => (prev ? { ...prev, bannerUrl: url } : prev))
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleRemoveBanner() {
    if (!user) return
    setUploadingBanner(true)
    try {
      await actualizarBanner(user.id, null)
      setProfile((prev) => (prev ? { ...prev, bannerUrl: undefined } : prev))
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setUploadingBanner(false)
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
        <View style={styles.bannerCard}>
          <View style={[styles.bannerBg, { backgroundColor: colorBanner }]}>
            {profile?.bannerUrl ? (
              <Image source={{ uri: profile.bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : null}
            <View style={[StyleSheet.absoluteFill, styles.bannerOverlay]} />
          </View>

          <Pressable
            style={styles.bannerEditButton}
            onPress={handleChangeBanner}
            disabled={uploadingBanner}
          >
            {uploadingBanner ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="image-outline" size={14} color="#ffffff" />
            )}
            <Text style={styles.bannerEditLabel}>Cambiar banner</Text>
          </Pressable>
          {profile?.bannerUrl ? (
            <Pressable style={styles.bannerRemoveButton} onPress={handleRemoveBanner} disabled={uploadingBanner}>
              <Text style={styles.bannerRemoveLabel}>Quitar banner</Text>
            </Pressable>
          ) : null}

          <View style={styles.avatarWrapper}>
            <Pressable onPress={handleChangeAvatar} disabled={uploadingAvatar}>
              <View style={styles.avatarRing}>
                <Avatar name={profile?.nombreUsuario ?? '?'} url={profile?.avatarUrl} size={80} />
              </View>
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

        <View style={styles.field}>
          <Text style={styles.label}>Color de banner</Text>
          <Text style={styles.bannerColorHint}>
            Fondo de tu tarjeta de perfil. Si subís una imagen con transparencia, este color queda detrás.
          </Text>
          <View style={styles.colorRow}>
            {COLORES_BANNER.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColorBanner(c)}
                style={[styles.colorSwatch, { backgroundColor: c }]}
              >
                {colorBanner.toLowerCase() === c.toLowerCase() ? (
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                ) : null}
              </Pressable>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.colorInput]}
            value={colorBanner}
            onChangeText={setColorBanner}
            placeholder="#6366f1"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.accountSection}>
          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Security')}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Seguridad y verificación en dos pasos</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('AppearanceSettings')}>
            <Ionicons name="image-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Apariencia</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('AppSettings')}>
            <Ionicons name="settings-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Configuración de la app</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('SavedMessages')}>
            <Ionicons name="bookmark-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Mensajes guardados</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('AccountHistory')}>
            <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Estado de mi cuenta</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Help')}>
            <Ionicons name="help-buoy-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Ayuda y soporte</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>

          {staffCaps.esStaff ? (
            <Pressable style={styles.linkRow} onPress={() => navigation.navigate('StaffPanel')}>
              <Ionicons name="shield-half-outline" size={18} color={colors.primary} />
              <Text style={styles.linkRowText}>Panel de staff</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}

          <Pressable style={styles.linkRow} onPress={() => navigation.navigate('Legal')}>
            <Ionicons name="document-text-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Términos y Privacidad</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
          </Pressable>

          <View style={styles.linkRow}>
            <Ionicons name="code-slash-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Temas</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Próximamente</Text>
            </View>
          </View>

          <Pressable style={styles.linkRow} onPress={() => checkForUpdates({ manual: true })}>
            <Ionicons name="cloud-download-outline" size={18} color={colors.mutedForeground} />
            <Text style={styles.linkRowText}>Buscar actualizaciones</Text>
            <Text style={styles.linkRowMeta}>v{APP_VERSION}</Text>
          </Pressable>

          <Pressable
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
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
        </View>

        <View style={styles.credits}>
          <Text style={styles.creditsTitle}>Acerca de</Text>
          <Pressable
            style={styles.creditsRow}
            onPress={() => Linking.openURL('https://github.com/anime1234rr')}
          >
            <Ionicons name="code-slash-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.creditsText}>Desarrollo — anime1234rr</Text>
            <Ionicons name="open-outline" size={12} color={colors.mutedForeground} />
          </Pressable>
          <Pressable
            style={styles.creditsRow}
            onPress={() => Linking.openURL('https://github.com/Axolote90')}
          >
            <Ionicons name="color-palette-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.creditsText}>Logotipo «Axolt» — Axolt</Text>
            <Ionicons name="open-outline" size={12} color={colors.mutedForeground} />
          </Pressable>
        </View>
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
  bannerCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerBg: {
    height: 110,
    width: '100%',
  },
  bannerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerEditButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bannerEditLabel: {
    color: '#ffffff',
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  bannerRemoveButton: {
    position: 'absolute',
    top: spacing.sm + 28,
    right: spacing.sm,
  },
  bannerRemoveLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs,
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.md,
    marginTop: -40,
  },
  avatarRing: {
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.card,
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
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  bannerColorHint: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorInput: {
    fontFamily: 'monospace',
    marginTop: spacing.xs,
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
  accountSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  linkRowText: { flex: 1, color: colors.foreground, fontSize: fontSize.md },
  linkRowMeta: { color: colors.mutedForeground, fontSize: fontSize.sm },
  comingSoonBadge: {
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  comingSoonText: { color: colors.mutedForeground, fontSize: 10, fontWeight: '600' },
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
  credits: {
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.xs,
  },
  creditsTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  creditsText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
})
