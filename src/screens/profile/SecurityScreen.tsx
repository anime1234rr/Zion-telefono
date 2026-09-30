import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { showAppAlert } from '@/hooks/use-app-alert'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { useRequireReauth } from '@/lib/reauth-gate'
import {
  actualizarPreferenciasNotificacionSeguridad,
  obtenerPreferenciasNotificacionSeguridad,
  type SecurityNotificationPrefs,
} from '@/lib/profiles'
import {
  confirmarEnrolamientoMfa,
  iniciarEnrolamientoMfa,
  listarFactoresMfa,
  quitarFactorMfa,
  type MfaEnrollment,
  type MfaFactor,
} from '@/lib/mfa'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const OPCIONES: { clave: keyof SecurityNotificationPrefs; label: string; description: string }[] = [
  {
    clave: 'cambioContrasena',
    label: 'Contraseña cambiada',
    description: 'Te avisamos cuando tu contraseña haya cambiado.',
  },
  {
    clave: 'cambioEmail',
    label: 'Correo electrónico cambiado',
    description: 'Te avisamos cuando tu dirección de correo haya cambiado.',
  },
  {
    clave: 'metodoLoginVinculado',
    label: 'Método de acceso vinculado',
    description: 'Te avisamos cuando se vincule un nuevo método de inicio de sesión a tu cuenta.',
  },
  {
    clave: 'metodoLoginEliminado',
    label: 'Método de acceso eliminado',
    description: 'Te avisamos cuando se elimine un método de inicio de sesión de tu cuenta.',
  },
  {
    clave: 'mfaAgregado',
    label: 'Verificación en dos pasos agregada',
    description: 'Te avisamos cuando se agregue un método de autenticación de doble factor (MFA).',
  },
  {
    clave: 'mfaEliminado',
    label: 'Verificación en dos pasos eliminada',
    description: 'Te avisamos cuando se elimine un método de autenticación de doble factor (MFA).',
  },
]

export function SecurityScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()
  const requireReauth = useRequireReauth()
  const userId = user?.id ?? null

  const [saved, setSaved] = useState<SecurityNotificationPrefs | null>(null)
  const [draft, setDraft] = useState<SecurityNotificationPrefs | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordChanged, setPasswordChanged] = useState(false)

  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [mfaLoading, setMfaLoading] = useState(true)
  const [enrolling, setEnrolling] = useState<MfaEnrollment | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaBusy, setMfaBusy] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelado = false
    obtenerPreferenciasNotificacionSeguridad(userId)
      .then((prefs) => {
        if (cancelado) return
        setSaved(prefs)
        setDraft(prefs)
      })
      .catch((err) => !cancelado && setLoadError(getErrorMessage(err)))
    return () => {
      cancelado = true
    }
  }, [userId])

  const cargarMfa = useCallback(() => {
    setMfaLoading(true)
    listarFactoresMfa()
      .then(setFactors)
      .catch(() => setFactors([]))
      .finally(() => setMfaLoading(false))
  }, [])

  useEffect(() => cargarMfa(), [cargarMfa])

  const isDirty =
    !!saved && !!draft && OPCIONES.some((opcion) => saved[opcion.clave] !== draft[opcion.clave])

  function handleToggle(clave: keyof SecurityNotificationPrefs, valor: boolean) {
    setDraft((prev) => (prev ? { ...prev, [clave]: valor } : prev))
  }

  async function handleSave() {
    if (!userId || !saved || !draft) return
    const cambios: Partial<SecurityNotificationPrefs> = {}
    for (const opcion of OPCIONES) {
      if (saved[opcion.clave] !== draft[opcion.clave]) cambios[opcion.clave] = draft[opcion.clave]
    }
    if (Object.keys(cambios).length === 0) return

    setSaving(true)
    try {
      await actualizarPreferenciasNotificacionSeguridad(userId, cambios)
      setSaved(draft)
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    setPasswordError(null)
    if (newPassword.length < 6) {
      setPasswordError('La contraseña tiene que tener al menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    const nonce = await requireReauth('Para cambiar tu contraseña, primero confirmá tu identidad.')
    if (nonce === null) return

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword, nonce })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      setPasswordChanged(true)
      setTimeout(() => setPasswordChanged(false), 3000)
    } catch (err) {
      setPasswordError(getErrorMessage(err))
    } finally {
      setChangingPassword(false)
    }
  }

  async function empezarMfa() {
    setMfaBusy(true)
    try {
      setEnrolling(await iniciarEnrolamientoMfa('Zion móvil'))
      setMfaCode('')
    } catch (err) {
      showAppAlert('No se pudo iniciar', getErrorMessage(err))
    } finally {
      setMfaBusy(false)
    }
  }

  async function cancelarEnrolamiento() {
    const pendiente = enrolling
    setEnrolling(null)
    setMfaCode('')
    if (pendiente) {
      await quitarFactorMfa(pendiente.factorId).catch(() => {})
    }
  }

  async function confirmarMfa() {
    if (!enrolling || mfaCode.trim().length < 6) return
    setMfaBusy(true)
    try {
      await confirmarEnrolamientoMfa(enrolling.factorId, mfaCode)
      setEnrolling(null)
      cargarMfa()
      showAppAlert('Verificación en dos pasos activada')
    } catch (err) {
      showAppAlert('Código incorrecto', getErrorMessage(err))
    } finally {
      setMfaBusy(false)
    }
  }

  function quitarMfa(f: MfaFactor) {
    showAppAlert('Quitar 2FA', '¿Desactivar la verificación en dos pasos de este dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          try {
            await quitarFactorMfa(f.id)
            cargarMfa()
          } catch (err) {
            showAppAlert('Error', getErrorMessage(err))
          }
        },
      },
    ])
  }

  const activos = factors.filter((f) => f.status === 'verified')

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Seguridad</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View>
          <Text style={styles.sectionTitle}>CUENTA</Text>
          <Pressable style={styles.row} onPress={() => navigation.navigate('ChangeEmail')}>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>Correo electrónico</Text>
              <Text style={styles.rowDescription}>{user?.email ?? '—'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>

          <View style={styles.passwordBox}>
            <Text style={styles.rowLabel}>Cambiar contraseña</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nueva contraseña"
                placeholderTextColor={colors.mutedForeground}
                selectionColor={colors.primary}
                cursorColor={colors.primary}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <Pressable style={styles.eyeButton} onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor={colors.mutedForeground}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
            />
            {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
            <Pressable
              style={[
                styles.smallButton,
                (changingPassword || !newPassword || !confirmPassword) && styles.smallButtonDisabled,
              ]}
              onPress={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? (
                <ActivityIndicator color={colors.primaryForeground} size="small" />
              ) : (
                <Text style={styles.smallButtonLabel}>
                  {passwordChanged ? 'Contraseña actualizada ✓' : 'Cambiar contraseña'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>NOTIFICACIONES DE SEGURIDAD</Text>
          <Text style={styles.sectionDescription}>
            Elegí sobre qué eventos de seguridad de tu cuenta querés recibir una notificación.
          </Text>

          {loadError ? (
            <Text style={styles.error}>{loadError}</Text>
          ) : !draft ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <View style={styles.optionsList}>
              {OPCIONES.map((opcion) => (
                <View key={opcion.clave} style={styles.optionRow}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowLabel}>{opcion.label}</Text>
                    <Text style={styles.rowDescription}>{opcion.description}</Text>
                  </View>
                  <Switch
                    value={draft[opcion.clave]}
                    onValueChange={(checked) => handleToggle(opcion.clave, checked)}
                    trackColor={{ true: colors.primary, false: colors.secondary }}
                  />
                </View>
              ))}

              <Pressable
                style={[styles.saveButton, (!isDirty || saving) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!isDirty || saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={styles.saveLabel}>Guardar cambios</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.sectionTitle}>VERIFICACIÓN EN DOS PASOS (TOTP)</Text>

          {mfaLoading ? (
            <Text style={styles.note}>Cargando…</Text>
          ) : enrolling ? (
            <View style={styles.card}>
              <Text style={styles.cardText}>
                Agregá esta clave a tu app de autenticación (Google Authenticator, Authy, 1Password…)
                y después ingresá el código de 6 dígitos.
              </Text>
              <Pressable
                style={styles.secretBox}
                onPress={() => Clipboard.setStringAsync(enrolling.secret)}
              >
                <Text style={styles.secret} selectable>
                  {enrolling.secret}
                </Text>
                <Ionicons name="copy-outline" size={16} color={colors.mutedForeground} />
              </Pressable>
              <TextInput
                style={styles.input}
                placeholder="Código de 6 dígitos"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={6}
                value={mfaCode}
                onChangeText={setMfaCode}
              />
              <View style={styles.rowActions}>
                <Pressable onPress={cancelarEnrolamiento} disabled={mfaBusy}>
                  <Text style={styles.cancel}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.smallButton, (mfaCode.trim().length < 6 || mfaBusy) && styles.smallButtonDisabled]}
                  onPress={confirmarMfa}
                  disabled={mfaCode.trim().length < 6 || mfaBusy}
                >
                  <Text style={styles.smallButtonLabel}>{mfaBusy ? 'Verificando…' : 'Activar'}</Text>
                </Pressable>
              </View>
            </View>
          ) : activos.length > 0 ? (
            <>
              {activos.map((f) => (
                <View key={f.id} style={styles.factorRow}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.online} />
                  <Text style={styles.rowLabel}>{f.friendlyName || 'App de autenticación'}</Text>
                  <Pressable onPress={() => quitarMfa(f)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </Pressable>
                </View>
              ))}
            </>
          ) : (
            <>
              <Text style={styles.note}>
                Sumá una capa extra pidiendo un código de tu app de autenticación al iniciar sesión.
              </Text>
              <Pressable
                style={[styles.smallButton, mfaBusy && styles.smallButtonDisabled]}
                onPress={empezarMfa}
                disabled={mfaBusy}
              >
                <Text style={styles.smallButtonLabel}>Activar verificación en dos pasos</Text>
              </Pressable>
            </>
          )}
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
  title: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  sectionTitle: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '700', marginBottom: spacing.sm },
  sectionDescription: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowLabel: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '600' },
  rowDescription: { color: colors.mutedForeground, fontSize: fontSize.xs },
  passwordBox: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  passwordRow: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: spacing.xxl },
  eyeButton: { position: 'absolute', right: spacing.sm },
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
  smallButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  smallButtonDisabled: { opacity: 0.6 },
  smallButtonLabel: { color: colors.primaryForeground, fontSize: fontSize.sm, fontWeight: '600' },
  optionsList: { gap: spacing.sm },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  error: { color: colors.destructive, fontSize: fontSize.sm },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveLabel: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '600' },
  note: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardText: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  secret: { color: colors.foreground, fontFamily: 'monospace', fontSize: fontSize.sm, flex: 1 },
  rowActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.lg },
  cancel: { color: colors.mutedForeground, fontSize: fontSize.md },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
})
