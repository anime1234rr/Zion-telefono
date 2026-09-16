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

type Step = 'request' | 'verify'

export function MagicLinkScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestCooldown = useCooldown()

  async function handleRequest() {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: AUTH_CALLBACK_URL },
      })
      if (error) throw error
      setStep('verify')
    } catch (err) {
      const seconds = getRateLimitSeconds(err)
      if (seconds) requestCooldown.start(seconds)
      else setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      })
      if (error) throw error
    } catch (err) {
      setError(getErrorMessage(err))
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
            <Text style={authStyles.title}>Iniciar sesión sin contraseña</Text>
            <Text style={authStyles.subtitle}>
              {step === 'request'
                ? 'Te enviamos un enlace y un código de un solo uso a tu correo.'
                : `Ingresá el código que te llegó a ${email}, o tocá el enlace del correo.`}
            </Text>

            <View style={authStyles.form}>
              {step === 'request' ? (
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
              ) : (
                <View style={authStyles.field}>
                  <Text style={authStyles.label}>Código</Text>
                  <TextInput
                    style={authStyles.codeInput}
                    value={code}
                    onChangeText={setCode}
                    placeholder="000000"
                    placeholderTextColor={colors.mutedForeground}
                    selectionColor={colors.primary}
                    cursorColor={colors.primary}
                    keyboardType="number-pad"
                    maxLength={8}
                    autoFocus
                  />
                </View>
              )}

              {error ? <Text style={authStyles.error}>{error}</Text> : null}

              <Pressable
                style={[
                  authStyles.submitButton,
                  (loading ||
                    (step === 'request'
                      ? !email.trim() || requestCooldown.secondsLeft > 0
                      : !code.trim())) &&
                    authStyles.submitButtonDisabled,
                ]}
                onPress={step === 'request' ? handleRequest : handleVerify}
                disabled={
                  loading ||
                  (step === 'request' ? !email.trim() || requestCooldown.secondsLeft > 0 : !code.trim())
                }
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={authStyles.submitLabel}>
                    {step === 'request'
                      ? requestCooldown.secondsLeft > 0
                        ? `Podés reintentar en ${requestCooldown.secondsLeft}s`
                        : 'Enviar código'
                      : 'Verificar e ingresar'}
                  </Text>
                )}
              </Pressable>
            </View>

            {step === 'verify' ? (
              <Pressable onPress={() => setStep('request')} hitSlop={8}>
                <Text style={authStyles.switchModeText}>Usar otro correo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}
