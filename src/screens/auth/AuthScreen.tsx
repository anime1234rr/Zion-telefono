import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Mode = 'signin' | 'signup'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [nombreUsuario, setNombreUsuario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmationSent, setConfirmationSent] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const nombreUsuarioTrim = nombreUsuario.trim()
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: nombreUsuarioTrim ? { nombre_usuario: nombreUsuarioTrim } : undefined,
          },
        })
        if (error) throw error
        if (!data.session) {
          setConfirmationSent(true)
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.center}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {mode === 'signin' ? 'Iniciar sesión en Zion' : 'Crear cuenta en Zion'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'Entrá con tu correo y contraseña.'
                : 'Registrate para empezar a crear servidores.'}
            </Text>

            {confirmationSent ? (
              <View style={styles.confirmationBox}>
                <Text style={styles.confirmationText}>
                  Te enviamos un correo de confirmación a <Text style={styles.bold}>{email}</Text>.
                  Confirmá tu cuenta y después iniciá sesión.
                </Text>
              </View>
            ) : (
              <View style={styles.form}>
                {mode === 'signup' ? (
                  <View style={styles.field}>
                    <Text style={styles.label}>Nombre de usuario</Text>
                    <TextInput
                      style={styles.input}
                      value={nombreUsuario}
                      onChangeText={setNombreUsuario}
                      placeholder="opcional"
                      placeholderTextColor={colors.mutedForeground}
                      selectionColor={colors.primary}
                      cursorColor={colors.primary}
                      autoCapitalize="none"
                      autoComplete="username"
                    />
                  </View>
                ) : null}

                <View style={styles.field}>
                  <Text style={styles.label}>Correo</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="tu@correo.com"
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.primary}
                    cursorColor={colors.primary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Contraseña</Text>
                  <View style={styles.passwordRow}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      placeholderTextColor={colors.mutedForeground}
                      selectionColor={colors.primary}
                      cursorColor={colors.primary}
                      autoCapitalize="none"
                      autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    />
                    <Pressable
                      style={styles.eyeButton}
                      onPress={() => setShowPassword((prev) => !prev)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </View>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Pressable
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <Text style={styles.submitLabel}>
                      {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            <Pressable
              onPress={() => {
                setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
                setError(null)
                setConfirmationSent(false)
              }}
            >
              <Text style={styles.switchModeText}>
                {mode === 'signin' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Iniciá sesión'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  confirmationBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  confirmationText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  bold: {
    fontWeight: '700',
  },
  form: {
    marginTop: spacing.lg,
    gap: spacing.md,
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
  passwordRow: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: spacing.xxl,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.sm,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  switchModeText: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textDecorationLine: 'underline',
  },
})
