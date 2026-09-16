import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { authStyles } from '@/screens/auth/auth-styles'

export function ResetPasswordConfirmScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user, pendingAuthAction, setPendingAuthAction } = useAuth()
  const sessionReady = user !== null
  const initialEmail = pendingAuthAction?.type === 'recovery' ? (pendingAuthAction.email ?? '') : ''

  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    (sessionReady || (email.trim() && code.trim())) &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword

  async function handleConfirm() {
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (newPassword.length < 6) {
      setError('La contraseña tiene que tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setPendingAuthAction({ type: 'recovery', email: email.trim() || undefined })

    try {
      if (!sessionReady) {
        const { error } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: code.trim(),
          type: 'recovery',
        })
        if (error) throw error
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPendingAuthAction(null)
    } catch (err) {
      setError(getErrorMessage(err))
      if (!sessionReady) setPendingAuthAction(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={authStyles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {!sessionReady ? (
          <View style={authStyles.header}>
            <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={colors.foreground} />
            </Pressable>
          </View>
        ) : null}

        <View style={authStyles.center}>
          <View style={authStyles.card}>
            <Text style={authStyles.title}>Nueva contraseña</Text>
            <Text style={authStyles.subtitle}>
              {sessionReady
                ? 'Elegí una nueva contraseña para tu cuenta.'
                : 'Ingresá el código que te llegó por correo junto con tu nueva contraseña.'}
            </Text>

            <View style={authStyles.form}>
              {!sessionReady ? (
                <>
                  <View style={authStyles.field}>
                    <Text style={authStyles.label}>Correo</Text>
                    <TextInput
                      style={authStyles.input}
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
                  <View style={authStyles.field}>
                    <Text style={authStyles.label}>Código</Text>
                    <TextInput
                      style={authStyles.input}
                      value={code}
                      onChangeText={setCode}
                      placeholder="000000"
                      placeholderTextColor={colors.mutedForeground}
                      selectionColor={colors.primary}
                      cursorColor={colors.primary}
                      keyboardType="number-pad"
                      maxLength={8}
                    />
                  </View>
                </>
              ) : null}

              <View style={authStyles.field}>
                <Text style={authStyles.label}>Nueva contraseña</Text>
                <View style={authStyles.passwordRow}>
                  <TextInput
                    style={[authStyles.input, authStyles.passwordInput]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.primary}
                    cursorColor={colors.primary}
                    autoCapitalize="none"
                    autoComplete="new-password"
                  />
                  <Pressable style={authStyles.eyeButton} onPress={() => setShowPassword((prev) => !prev)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={authStyles.field}>
                <Text style={authStyles.label}>Confirmar contraseña</Text>
                <TextInput
                  style={authStyles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  placeholderTextColor={colors.mutedForeground}
                  selectionColor={colors.primary}
                  cursorColor={colors.primary}
                  autoCapitalize="none"
                  autoComplete="new-password"
                />
              </View>

              {error ? <Text style={authStyles.error}>{error}</Text> : null}

              <Pressable
                style={[authStyles.submitButton, (loading || !canSubmit) && authStyles.submitButtonDisabled]}
                onPress={handleConfirm}
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={authStyles.submitLabel}>Guardar contraseña</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}
