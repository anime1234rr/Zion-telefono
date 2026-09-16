import { useState } from 'react'
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { AUTH_CALLBACK_URL } from '@/lib/auth-deep-links'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { authStyles } from '@/screens/auth/auth-styles'

type Mode = 'signin' | 'signup'

export function AuthScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
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
            emailRedirectTo: AUTH_CALLBACK_URL,
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
        style={authStyles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={authStyles.center}>
          <View style={authStyles.card}>
            <Image
              source={require('../../../assets/zion-logo.png')}
              style={{ width: 64, height: 64, marginBottom: 12 }}
              resizeMode="contain"
            />
            <Text style={authStyles.title}>
              {mode === 'signin' ? 'Iniciar sesión en Zion' : 'Crear cuenta en Zion'}
            </Text>
            <Text style={authStyles.subtitle}>
              {mode === 'signin'
                ? 'Entrá con tu correo y contraseña.'
                : 'Registrate para empezar a crear servidores.'}
            </Text>

            {confirmationSent ? (
              <View style={authStyles.confirmationBox}>
                <Text style={authStyles.confirmationText}>
                  Te enviamos un correo de confirmación a <Text style={authStyles.bold}>{email}</Text>.
                  Tocá el enlace o ingresá el código que te llegó para activar tu cuenta.
                </Text>
                <Pressable
                  style={[authStyles.submitButton, { marginTop: 12 }]}
                  onPress={() => navigation.navigate('ConfirmSignUp', { email })}
                >
                  <Text style={authStyles.submitLabel}>Ingresar código</Text>
                </Pressable>
              </View>
            ) : (
              <View style={authStyles.form}>
                {mode === 'signup' ? (
                  <View style={authStyles.field}>
                    <Text style={authStyles.label}>Nombre de usuario</Text>
                    <TextInput
                      style={authStyles.input}
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
                  <Text style={authStyles.label}>Contraseña</Text>
                  <View style={authStyles.passwordRow}>
                    <TextInput
                      style={[authStyles.input, authStyles.passwordInput]}
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
                      style={authStyles.eyeButton}
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

                {error ? <Text style={authStyles.error}>{error}</Text> : null}

                <Pressable
                  style={[authStyles.submitButton, loading && authStyles.submitButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <Text style={authStyles.submitLabel}>
                      {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </Text>
                  )}
                </Pressable>

                {mode === 'signin' ? (
                  <View style={authStyles.linksRow}>
                    <Pressable onPress={() => navigation.navigate('MagicLink')} hitSlop={8}>
                      <Text style={authStyles.switchModeText}>Iniciar sesión con código o enlace</Text>
                    </Pressable>
                    <Pressable onPress={() => navigation.navigate('ResetPasswordRequest')} hitSlop={8}>
                      <Text style={authStyles.switchModeText}>¿Olvidaste tu contraseña?</Text>
                    </Pressable>
                    <Pressable onPress={() => navigation.navigate('InviteAccept')} hitSlop={8}>
                      <Text style={authStyles.switchModeText}>Tengo una invitación</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            )}

            <Pressable
              onPress={() => {
                setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'))
                setError(null)
                setConfirmationSent(false)
              }}
            >
              <Text style={authStyles.switchModeText}>
                {mode === 'signin' ? '¿No tenés cuenta? Creá una' : '¿Ya tenés cuenta? Iniciá sesión'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}
