import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import { useAuth } from '@/hooks/use-auth'
import { verificarCodigoMfa } from '@/lib/mfa'
import { getErrorMessage } from '@/lib/utils'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/theme'
import { authStyles } from '@/screens/auth/auth-styles'

export function MfaChallengeScreen() {
  const { user, signOut, refreshMfa } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleVerify() {
    if (code.trim().length < 6) return
    setError(null)
    setLoading(true)
    try {
      await verificarCodigoMfa(code)
      await refreshMfa()
    } catch (err) {
      setError(getErrorMessage(err))
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || code.trim().length < 6

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={authStyles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={authStyles.center}>
          <View style={authStyles.card}>
            <Ionicons name="shield-checkmark" size={32} color={colors.primary} style={{ marginBottom: spacing.sm }} />
            <Text style={authStyles.title}>Verificación en dos pasos</Text>
            <Text style={authStyles.subtitle}>
              Tu cuenta{user?.email ? ` (${user.email})` : ''} tiene la verificación en dos pasos activada.
              Ingresá el código de 6 dígitos de tu app de autenticación para continuar.
            </Text>

            <View style={authStyles.form}>
              <View style={authStyles.field}>
                <Text style={authStyles.label}>Código</Text>
                <TextInput
                  style={authStyles.codeInput}
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
                  placeholder="000000"
                  placeholderTextColor={colors.mutedForeground}
                  selectionColor={colors.primary}
                  cursorColor={colors.primary}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  maxLength={6}
                  autoFocus
                />
              </View>

              {error ? <Text style={authStyles.error}>{error}</Text> : null}

              <Pressable
                style={[authStyles.submitButton, disabled && authStyles.submitButtonDisabled]}
                onPress={handleVerify}
                disabled={disabled}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={authStyles.submitLabel}>Verificar</Text>
                )}
              </Pressable>
            </View>

            <Pressable onPress={signOut} hitSlop={8}>
              <Text style={authStyles.switchModeText}>Cerrar sesión</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}
