import { useCallback, useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { supabase } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'
import { getRateLimitSeconds } from '@/lib/rate-limit'
import { useCooldown } from '@/hooks/use-cooldown'
import { resolveReauth } from '@/lib/reauth-gate'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { authStyles } from '@/screens/auth/auth-styles'

type Props = NativeStackScreenProps<RootStackParamList, 'Reauthenticate'>

export function ReauthenticateScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { params } = useRoute<Props['route']>()
  const { id, reason } = params

  const [code, setCode] = useState('')
  const [sending, setSending] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { secondsLeft: cooldownLeft, start: startCooldown } = useCooldown()
  const resolvedRef = useRef(false)

  const performSend = useCallback(() => {
    return supabase.auth
      .reauthenticate()
      .then(({ error }) => {
        if (!error) return
        const seconds = getRateLimitSeconds(error)
        if (seconds) startCooldown(seconds)
        else setError(getErrorMessage(error))
      })
      .finally(() => setSending(false))
  }, [startCooldown])

  useEffect(() => {
    performSend()
    return () => {
      if (!resolvedRef.current) resolveReauth(id, null)
    }
  }, [id, performSend])

  function handleResend() {
    setSending(true)
    setError(null)
    performSend()
  }

  function finish(nonce: string | null) {
    resolvedRef.current = true
    resolveReauth(id, nonce)
    navigation.goBack()
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={authStyles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={authStyles.header}>
          <Pressable onPress={() => finish(null)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={authStyles.center}>
          <View style={authStyles.card}>
            <Text style={authStyles.title}>Confirmá que sos vos</Text>
            <Text style={authStyles.subtitle}>{reason}</Text>
            <Text style={authStyles.subtitle}>
              {sending
                ? 'Enviando un código de verificación por correo…'
                : 'Te enviamos un código de verificación por correo. Ingresalo para continuar.'}
            </Text>

            <View style={authStyles.form}>
              <View style={authStyles.field}>
                <Text style={authStyles.label}>Código de verificación</Text>
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
                  editable={!sending}
                  autoFocus
                />
              </View>

              <Pressable onPress={handleResend} disabled={sending || cooldownLeft > 0} hitSlop={8}>
                <Text style={authStyles.switchModeText}>
                  {cooldownLeft > 0 ? `Podés reenviarlo en ${cooldownLeft}s` : 'Reenviar código'}
                </Text>
              </Pressable>

              {error ? <Text style={authStyles.error}>{error}</Text> : null}

              <Pressable
                style={[authStyles.submitButton, (sending || !code.trim()) && authStyles.submitButtonDisabled]}
                onPress={() => finish(code.trim())}
                disabled={sending || !code.trim()}
              >
                <Text style={authStyles.submitLabel}>Confirmar identidad</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => finish(null)} hitSlop={8}>
              <Text style={authStyles.switchModeText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}
