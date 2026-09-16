import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { getRateLimitSeconds } from '@/lib/rate-limit'
import { useCooldown } from '@/hooks/use-cooldown'
import { useRequireReauth } from '@/lib/reauth-gate'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'
import { authStyles } from '@/screens/auth/auth-styles'

type Step = 'request' | 'confirm' | 'done'

export function ChangeEmailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()
  const requireReauth = useRequireReauth()

  const [step, setStep] = useState<Step>('request')
  const [newEmail, setNewEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestCooldown = useCooldown()

  async function handleRequest() {
    setError(null)
    const email = newEmail.trim()
    if (!email || email === user?.email) {
      setError('Ingresá un correo distinto al actual.')
      return
    }

    const nonce = await requireReauth('Para cambiar tu correo, primero confirmá tu identidad.')
    if (nonce === null) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ email, nonce })
      if (error) throw error
      setStep('confirm')
    } catch (err) {
      const seconds = getRateLimitSeconds(err)
      if (seconds) requestCooldown.start(seconds)
      else setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: newEmail.trim(),
        token: code.trim(),
        type: 'email_change',
      })
      if (error) throw error
      setStep('done')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={authStyles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Cambiar correo</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={authStyles.center}>
          <View style={authStyles.card}>
            {step === 'done' ? (
              <>
                <Text style={authStyles.title}>Correo actualizado</Text>
                <Text style={authStyles.subtitle}>
                  Tu correo ahora es <Text style={authStyles.bold}>{newEmail.trim()}</Text>.
                </Text>
                <Pressable style={[authStyles.submitButton, { marginTop: spacing.lg }]} onPress={() => navigation.goBack()}>
                  <Text style={authStyles.submitLabel}>Listo</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={authStyles.title}>
                  {step === 'request' ? 'Cambiar tu correo' : 'Confirmá el nuevo correo'}
                </Text>
                <Text style={authStyles.subtitle}>
                  {step === 'request'
                    ? `Correo actual: ${user?.email ?? '—'}`
                    : `Te enviamos un código a ${newEmail.trim()}. Ingresalo para confirmar el cambio.`}
                </Text>

                <View style={authStyles.form}>
                  {step === 'request' ? (
                    <View style={authStyles.field}>
                      <Text style={authStyles.label}>Nuevo correo</Text>
                      <TextInput
                        style={authStyles.input}
                        value={newEmail}
                        onChangeText={setNewEmail}
                        placeholder="nuevo@correo.com"
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
                  )}

                  {error ? <Text style={authStyles.error}>{error}</Text> : null}

                  <Pressable
                    style={[
                      authStyles.submitButton,
                      (loading ||
                        (step === 'request'
                          ? !newEmail.trim() || requestCooldown.secondsLeft > 0
                          : !code.trim())) &&
                        authStyles.submitButtonDisabled,
                    ]}
                    onPress={step === 'request' ? handleRequest : handleConfirm}
                    disabled={
                      loading ||
                      (step === 'request'
                        ? !newEmail.trim() || requestCooldown.secondsLeft > 0
                        : !code.trim())
                    }
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.primaryForeground} />
                    ) : (
                      <Text style={authStyles.submitLabel}>
                        {step === 'request'
                          ? requestCooldown.secondsLeft > 0
                            ? `Podés reintentar en ${requestCooldown.secondsLeft}s`
                            : 'Continuar'
                          : 'Confirmar cambio'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
  headerTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
})
