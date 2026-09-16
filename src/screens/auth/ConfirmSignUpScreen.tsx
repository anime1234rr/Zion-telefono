import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { getRateLimitSeconds } from '@/lib/rate-limit'
import { useCooldown } from '@/hooks/use-cooldown'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { authStyles } from '@/screens/auth/auth-styles'

type Props = NativeStackScreenProps<RootStackParamList, 'ConfirmSignUp'>

export function ConfirmSignUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { params } = useRoute<Props['route']>()
  const { email } = params

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resendCooldown = useCooldown()

  async function handleConfirm() {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'signup',
      })
      if (error) throw error
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError(null)
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) throw error
    } catch (err) {
      const seconds = getRateLimitSeconds(err)
      if (seconds) resendCooldown.start(seconds)
      else setError(getErrorMessage(err))
    } finally {
      setResending(false)
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
            <Text style={authStyles.title}>Confirmá tu cuenta</Text>
            <Text style={authStyles.subtitle}>
              Te enviamos un código a <Text style={authStyles.bold}>{email}</Text>. Ingresalo para
              activar tu cuenta.
            </Text>

            <View style={authStyles.form}>
              <View style={authStyles.field}>
                <Text style={authStyles.label}>Código de confirmación</Text>
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

              {error ? <Text style={authStyles.error}>{error}</Text> : null}

              <Pressable
                style={[authStyles.submitButton, (loading || !code.trim()) && authStyles.submitButtonDisabled]}
                onPress={handleConfirm}
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={authStyles.submitLabel}>Confirmar</Text>
                )}
              </Pressable>
            </View>

            <Pressable onPress={handleResend} disabled={resending || resendCooldown.secondsLeft > 0} hitSlop={8}>
              <Text style={authStyles.switchModeText}>
                {resending
                  ? 'Reenviando…'
                  : resendCooldown.secondsLeft > 0
                    ? `Podés reintentar en ${resendCooldown.secondsLeft}s`
                    : '¿No te llegó? Reenviar código'}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}
