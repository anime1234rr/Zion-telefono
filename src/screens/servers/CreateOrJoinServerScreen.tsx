import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { crearServidor, unirseAServidor } from '@/lib/servers'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Mode = 'create' | 'join'

export function CreateOrJoinServerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [mode, setMode] = useState<Mode>('create')
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const servidor =
        mode === 'create' ? await crearServidor(nombre.trim()) : await unirseAServidor(codigo.trim())
      navigation.replace('ServerChannels', { serverId: servidor.id })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const disabled = mode === 'create' ? nombre.trim().length === 0 : codigo.trim().length === 0

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>{mode === 'create' ? 'Crear servidor' : 'Unirse a un servidor'}</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, mode === 'create' && styles.tabActive]}
          onPress={() => setMode('create')}
        >
          <Text style={[styles.tabLabel, mode === 'create' && styles.tabLabelActive]}>Crear</Text>
        </Pressable>
        <Pressable style={[styles.tab, mode === 'join' && styles.tabActive]} onPress={() => setMode('join')}>
          <Text style={[styles.tabLabel, mode === 'join' && styles.tabLabelActive]}>Unirse</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        {mode === 'create' ? (
          <View style={styles.field}>
            <Text style={styles.label}>Nombre del servidor</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Mi comunidad"
              placeholderTextColor={colors.mutedForeground}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
            />
          </View>
        ) : (
          <View style={styles.field}>
            <Text style={styles.label}>Código de invitación</Text>
            <TextInput
              style={styles.input}
              value={codigo}
              onChangeText={setCodigo}
              placeholder="abc123"
              placeholderTextColor={colors.mutedForeground}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              autoCapitalize="none"
            />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submitButton, (disabled || loading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={disabled || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.submitLabel}>{mode === 'create' ? 'Crear' : 'Unirse'}</Text>
          )}
        </Pressable>
      </View>
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
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.primaryForeground,
  },
  form: {
    padding: spacing.lg,
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
    opacity: 0.5,
  },
  submitLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
