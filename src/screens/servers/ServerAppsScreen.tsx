import { useCallback, useEffect, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { EmptyState } from '@/components/EmptyState'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  crearTokenApp,
  listarTokensDeApps,
  revocarTokenApp,
  type AppToken,
} from '@/lib/appTokens'
import { listarRolesDeServidor, type ServerRole } from '@/lib/members'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerApps'>

export function ServerAppsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [tokens, setTokens] = useState<AppToken[]>([])
  const [roles, setRoles] = useState<ServerRole[]>([])
  const [creating, setCreating] = useState(false)
  const [nombre, setNombre] = useState('')
  const [rolId, setRolId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [nuevoToken, setNuevoToken] = useState<string | null>(null)

  const cargar = useCallback(() => {
    listarTokensDeApps(serverId).then(setTokens).catch(() => {})
  }, [serverId])

  useEffect(() => {
    cargar()
    listarRolesDeServidor(serverId)
      .then((r) => setRoles(r.filter((x) => !x.esRolBase)))
      .catch(() => {})
  }, [serverId, cargar])

  async function handleCrear() {
    if (!nombre.trim() || !rolId) return
    setBusy(true)
    try {
      const { token } = await crearTokenApp(serverId, rolId, nombre)
      setCreating(false)
      setNombre('')
      setRolId(null)
      setNuevoToken(token)
      cargar()
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleRevocar(t: AppToken) {
    showAppAlert('Revocar token', `¿Revocar "${t.nombre}"? La app dejará de funcionar.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revocar',
        style: 'destructive',
        onPress: async () => {
          try {
            await revocarTokenApp(t.id)
            cargar()
          } catch (err) {
            showAppAlert('Error', getErrorMessage(err))
          }
        },
      },
    ])
  }

  const activos = tokens.filter((t) => !t.revocado)

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Apps y bots</Text>
        <Pressable onPress={() => setCreating(true)} hitSlop={8}>
          <Ionicons name="add" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      {activos.length === 0 ? (
        <EmptyState title="No hay apps" description="Tocá + para crear un token de app." />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {activos.map((t) => (
            <View key={t.id} style={styles.card}>
              <View style={styles.cardMain}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {t.nombre}
                </Text>
                <Text style={styles.cardSub}>
                  Rol: {t.rolNombre}
                  {t.ultimoUsoAt ? ' · usado' : ' · sin uso'}
                </Text>
              </View>
              <Pressable onPress={() => handleRevocar(t)} hitSlop={8}>
                <Ionicons name="close-circle-outline" size={20} color={colors.destructive} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={creating} transparent animationType="fade" onRequestClose={() => setCreating(false)}>
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Nueva app</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la app"
              placeholderTextColor={colors.mutedForeground}
              value={nombre}
              onChangeText={setNombre}
            />
            <Text style={styles.fieldLabel}>Rol</Text>
            <ScrollView style={styles.roleList}>
              {roles.map((r) => (
                <Pressable
                  key={r.id}
                  style={[styles.roleRow, rolId === r.id && styles.roleRowActive]}
                  onPress={() => setRolId(r.id)}
                >
                  <View style={[styles.roleDot, { backgroundColor: r.color ?? '#9ca3af' }]} />
                  <Text style={styles.roleName}>{r.nombre}</Text>
                  {rolId === r.id ? (
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.dialogActions}>
              <Pressable onPress={() => setCreating(false)}>
                <Text style={styles.cancel}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.confirm, (!nombre.trim() || !rolId || busy) && styles.confirmDisabled]}
                onPress={handleCrear}
                disabled={!nombre.trim() || !rolId || busy}
              >
                <Text style={styles.confirmText}>{busy ? 'Creando…' : 'Crear'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={nuevoToken !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setNuevoToken(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Token creado</Text>
            <Text style={styles.tokenNote}>
              Copialo ahora — no se vuelve a mostrar.
            </Text>
            <Text style={styles.tokenValue} selectable>
              {nuevoToken}
            </Text>
            <View style={styles.dialogActions}>
              <Pressable
                style={styles.confirm}
                onPress={async () => {
                  if (nuevoToken) await Clipboard.setStringAsync(nuevoToken)
                  setNuevoToken(null)
                }}
              >
                <Text style={styles.confirmText}>Copiar y cerrar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  cardMain: { flex: 1, gap: 2 },
  cardName: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  cardSub: { color: colors.mutedForeground, fontSize: fontSize.xs },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dialogTitle: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '700' },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
  },
  fieldLabel: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '700', marginTop: spacing.xs },
  roleList: { maxHeight: 180 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  roleRowActive: { backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: radius.sm },
  roleDot: { width: 10, height: 10, borderRadius: 5 },
  roleName: { color: colors.foreground, fontSize: fontSize.sm, flex: 1 },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  cancel: { color: colors.mutedForeground, fontSize: fontSize.md },
  confirm: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  confirmDisabled: { opacity: 0.5 },
  confirmText: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '700' },
  tokenNote: { color: colors.mutedForeground, fontSize: fontSize.xs },
  tokenValue: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
    backgroundColor: colors.input,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
})
