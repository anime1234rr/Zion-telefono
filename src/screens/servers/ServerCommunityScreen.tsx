import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { useAuth } from '@/hooks/use-auth'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  activarComunidad,
  actualizarServidor,
  desactivarComunidad,
  listarServidores,
} from '@/lib/servers'
import { listarMiembros } from '@/lib/members'
import { getErrorMessage } from '@/lib/utils'
import type { ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerCommunity'>

const MIEMBROS_MINIMOS = 10
const DESC_MAX = 300

export function ServerCommunityScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [memberCount, setMemberCount] = useState<number | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [busy, setBusy] = useState(false)

  const isOwner = !!(server && user && server.ownerId === user.id)

  const cargar = useCallback(() => {
    listarServidores()
      .then((servers) => {
        const s = servers.find((x) => x.id === serverId) ?? null
        setServer(s)
        setDescripcion(s?.description ?? '')
      })
      .catch(() => {})
  }, [serverId])

  useFocusEffect(useCallback(() => cargar(), [cargar]))

  useEffect(() => {
    listarMiembros(serverId)
      .then((m) => setMemberCount(m.length))
      .catch(() => setMemberCount(0))
  }, [serverId])

  const requisitos = [
    {
      label: `Al menos ${MIEMBROS_MINIMOS} miembros`,
      ok: memberCount !== null && memberCount >= MIEMBROS_MINIMOS,
    },
    { label: 'El servidor tiene un ícono', ok: Boolean(server?.iconUrl) },
    { label: 'Canal de bienvenida configurado', ok: Boolean(server?.welcomeChannelId) },
    { label: 'Canal de normas configurado', ok: Boolean(server?.rulesChannelId) },
    {
      label: 'Verificación media o superior',
      ok: server?.verificationLevel === 'medio' || server?.verificationLevel === 'alto',
    },
  ]
  const todos = requisitos.every((r) => r.ok)

  async function handleToggle() {
    if (!server) return
    setBusy(true)
    try {
      const updated = server.communityEnabled
        ? await desactivarComunidad(serverId)
        : await activarComunidad(serverId)
      setServer(updated)
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleGuardarDesc() {
    setBusy(true)
    try {
      setServer(await actualizarServidor(serverId, { descripcion }))
      showAppAlert('Descripción guardada')
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Comunidad</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <Ionicons
            name="rocket-outline"
            size={20}
            color={server?.communityEnabled ? colors.primary : colors.mutedForeground}
          />
          <View style={styles.flex}>
            <Text style={styles.statusTitle}>
              {server?.communityEnabled ? 'Comunidad activada' : 'Comunidad no activada'}
            </Text>
            <Text style={styles.statusDesc}>
              {server?.communityEnabled
                ? 'Este servidor aparece en Explorar.'
                : 'Cumplí los requisitos para poder activarla.'}
            </Text>
          </View>
        </View>

        {server?.communityEnabled && isOwner ? (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>DESCRIPCIÓN</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="De qué trata esta comunidad. Se muestra en Explorar."
              placeholderTextColor={colors.mutedForeground}
              value={descripcion}
              onChangeText={setDescripcion}
              maxLength={DESC_MAX}
              multiline
            />
            <View style={styles.descFooter}>
              <Text style={styles.counter}>
                {descripcion.length}/{DESC_MAX}
              </Text>
              <Pressable
                style={[styles.btn, ((server.description ?? '') === descripcion || busy) && styles.btnDisabled]}
                onPress={handleGuardarDesc}
                disabled={busy || (server.description ?? '') === descripcion}
              >
                <Text style={styles.btnText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={[styles.blockLabel, styles.gap]}>REQUISITOS</Text>
        {requisitos.map((r) => (
          <View key={r.label} style={styles.reqRow}>
            <Ionicons
              name={r.ok ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={r.ok ? colors.online : colors.destructive}
            />
            <Text style={styles.reqLabel}>{r.label}</Text>
          </View>
        ))}

        {isOwner ? (
          <Pressable
            style={[
              styles.toggleBtn,
              server?.communityEnabled ? styles.toggleBtnOff : (!todos || busy) && styles.btnDisabled,
            ]}
            onPress={handleToggle}
            disabled={busy || (!server?.communityEnabled && !todos)}
          >
            <Text
              style={[styles.toggleBtnText, server?.communityEnabled && styles.toggleBtnTextOff]}
            >
              {server?.communityEnabled ? 'Desactivar comunidad' : 'Activar comunidad'}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.note}>Solo el propietario puede gestionar la comunidad.</Text>
        )}
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statusTitle: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  statusDesc: { color: colors.mutedForeground, fontSize: fontSize.xs, marginTop: 2 },
  block: { gap: spacing.xs },
  blockLabel: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '700' },
  gap: { marginTop: spacing.md },
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
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  descFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: { color: colors.mutedForeground, fontSize: fontSize.xs },
  reqRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  reqLabel: { color: colors.foreground, fontSize: fontSize.sm },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: colors.primaryForeground, fontSize: fontSize.sm, fontWeight: '700' },
  toggleBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  toggleBtnOff: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.destructive,
  },
  toggleBtnText: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '700' },
  toggleBtnTextOff: { color: colors.destructive },
  note: { color: colors.mutedForeground, fontSize: fontSize.sm, marginTop: spacing.lg },
})
