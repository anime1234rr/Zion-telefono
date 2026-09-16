import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { getRateLimitSeconds } from '@/lib/rate-limit'
import { useCooldown } from '@/hooks/use-cooldown'
import { AUTH_CALLBACK_URL } from '@/lib/auth-deep-links'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { authStyles } from '@/screens/auth/auth-styles'

export function ResetPasswordRequestScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestCooldown = useCooldown()

  async function handleRequest() {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: AUTH_CALLBACK_URL,
      })
      if (error) throw error
      navigation.navigate('ResetPasswordConfirm')
    } catch (err) {
      const seconds = getRateLimitSeconds(err)
      if (seconds) requestCooldown.start(seconds)
      else setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={authStyles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={authStyles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={authStyles.center}>
          <View style={authStyles.card}>
            <Text style={authStyles.title}>Recuperar contraseña</Text>
            <Text style={authStyles.subtitle}>
              Ingresá tu correo y te enviamos un enlace y un código para restablecer tu contraseña.
            </Text>

            <View style={authStyles.form}>
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
                  autoFocus
                />
              </View>

              {error ? <Text style={authStyles.error}>{error}</Text> : null}

              <Pressable
                style={[
                  authStyles.submitButton,
                  (loading || !email.trim() || requestCooldown.secondsLeft > 0) &&
                    authStyles.submitButtonDisabled,
                ]}
                onPress={handleRequest}
                disabled={loading || !email.trim() || requestCooldown.secondsLeft > 0}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={authStyles.submitLabel}>
                    {requestCooldown.secondsLeft > 0
                      ? `Podés reintentar en ${requestCooldown.secondsLeft}s`
                      : 'Enviar instrucciones'}
                  </Text>
                )}
              </Pressable>
            </View>

            <Pressable onPress={() => navigation.navigate('ResetPasswordConfirm')} hitSlop={8}>
              <Text style={authStyles.switchModeText}>Ya tengo un código</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}
