import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { useAuth } from '@/hooks/use-auth'
import { showAppAlert } from '@/hooks/use-app-alert'
import { actualizarServidor, listarServidores } from '@/lib/servers'
import {
  AUTOMOD_VACIO,
  guardarAutomodConfig,
  levantarBloqueoRaid,
  obtenerAutomodConfig,
  type AdjuntosPermitidos,
  type AutomodConfig,
} from '@/lib/automod'
import { getErrorMessage } from '@/lib/utils'
import type { ServerHistoryRetention, ServerItem, ServerVerificationLevel } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerModeration'>

const NIVELES: { value: ServerVerificationLevel; label: string; desc: string }[] = [
  { value: 'ninguno', label: 'Ninguno', desc: 'Cualquiera puede escribir apenas se une.' },
  { value: 'bajo', label: 'Bajo', desc: 'Requiere correo verificado.' },
  { value: 'medio', label: 'Medio', desc: 'Correo verificado y cierta antigüedad.' },
  { value: 'alto', label: 'Alto', desc: 'Correo verificado y antigüedad mayor.' },
]

const RETENCIONES: { value: ServerHistoryRetention; label: string }[] = [
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: '1a', label: '1 año' },
  { value: 'para_siempre', label: 'Para siempre' },
]

const SLOWMODE = [0, 5, 10, 30, 60, 300]
const EDAD = [0, 1, 6, 24, 72, 168]
const MENCIONES = [0, 3, 5, 10]
const RAID_UMBRAL = [0, 5, 10, 20, 50]
const RAID_VENTANA = [30, 60, 300]
const RAID_COOLDOWN = [300, 1800, 7200]

const ADJUNTOS: { value: AdjuntosPermitidos; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'solo_imagenes', label: 'Solo imágenes' },
  { value: 'ninguno', label: 'Bloquear' },
]

function segLabel(seg: number): string {
  if (seg === 0) return 'Off'
  if (seg < 60) return `${seg} s`
  if (seg < 3600) return `${seg / 60} min`
  return `${seg / 3600} h`
}
function edadLabel(h: number): string {
  if (h === 0) return 'Off'
  if (h < 24) return `${h} h`
  return `${h / 24} d`
}

function Radio({
  active,
  label,
  desc,
  onPress,
  disabled,
}: {
  active: boolean
  label: string
  desc?: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      style={[styles.radio, active && styles.radioActive]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.radioDot, active && styles.radioDotActive]}>
        {active ? <Ionicons name="checkmark" size={12} color={colors.primaryForeground} /> : null}
      </View>
      <View style={styles.flex}>
        <Text style={styles.radioLabel}>{label}</Text>
        {desc ? <Text style={styles.radioDesc}>{desc}</Text> : null}
      </View>
    </Pressable>
  )
}

function Segments<T extends string | number>({
  options,
  value,
  render,
  onChange,
  disabled,
}: {
  options: T[]
  value: T
  render: (o: T) => string
  onChange: (o: T) => void
  disabled?: boolean
}) {
  return (
    <View style={styles.segRow}>
      {options.map((o) => (
        <Pressable
          key={String(o)}
          style={[styles.seg, value === o && styles.segActive]}
          onPress={() => onChange(o)}
          disabled={disabled}
        >
          <Text style={[styles.segText, value === o && styles.segTextActive]}>{render(o)}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function ServerModerationScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [cfg, setCfg] = useState<AutomodConfig>(AUTOMOD_VACIO)
  const [palabrasTexto, setPalabrasTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingCfg, setSavingCfg] = useState(false)
  const [ahora, setAhora] = useState(() => Date.now())

  const isOwner = !!(server && user && server.ownerId === user.id)

  useFocusEffect(
    useCallback(() => {
      listarServidores()
        .then((servers) => setServer(servers.find((s) => s.id === serverId) ?? null))
        .catch(() => {})
    }, [serverId])
  )

  useEffect(() => {
    obtenerAutomodConfig(serverId)
      .then((c) => {
        setCfg(c)
        setPalabrasTexto(c.palabrasBloqueadas.join('\n'))
      })
      .catch((err) => console.error('No se pudo cargar AutoMod', err))
      .finally(() => setLoading(false))
  }, [serverId])

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  async function patchServer(cambios: Parameters<typeof actualizarServidor>[1]) {
    try {
      setServer(await actualizarServidor(serverId, cambios))
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    }
  }

  async function guardarAutomod() {
    setSavingCfg(true)
    try {
      const palabras = palabrasTexto.split('\n').map((p) => p.trim()).filter(Boolean)
      const guardado = await guardarAutomodConfig(serverId, { ...cfg, palabrasBloqueadas: palabras })
      setCfg(guardado)
      setPalabrasTexto(guardado.palabrasBloqueadas.join('\n'))
      showAppAlert('AutoMod guardado')
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    } finally {
      setSavingCfg(false)
    }
  }

  const bloqueadoRaid =
    cfg.raidBloqueadoHasta != null && new Date(cfg.raidBloqueadoHasta).getTime() > ahora

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Moderación</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>NIVEL DE VERIFICACIÓN</Text>
        {NIVELES.map((n) => (
          <Radio
            key={n.value}
            active={server?.verificationLevel === n.value}
            label={n.label}
            desc={n.desc}
            disabled={!isOwner}
            onPress={() => patchServer({ verificationLevel: n.value })}
          />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionGap]}>RETENCIÓN DE HISTORIAL</Text>
        {RETENCIONES.map((r) => (
          <Radio
            key={r.value}
            active={server?.historyRetention === r.value}
            label={r.label}
            disabled={!isOwner}
            onPress={() => patchServer({ historyRetention: r.value })}
          />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionGap]}>AUTOMOD</Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
        ) : !isOwner ? (
          <Text style={styles.note}>Solo el propietario del servidor puede configurar AutoMod.</Text>
        ) : (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Palabras bloqueadas</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Una palabra o frase por línea"
              placeholderTextColor={colors.mutedForeground}
              value={palabrasTexto}
              onChangeText={setPalabrasTexto}
              multiline
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Bloquear enlaces</Text>
              <Switch
                value={cfg.bloquearEnlaces}
                onValueChange={(v) => setCfg((c) => ({ ...c, bloquearEnlaces: v }))}
                trackColor={{ true: colors.primary }}
              />
            </View>

            <Text style={styles.fieldLabel}>Modo lento</Text>
            <Segments
              options={SLOWMODE}
              value={cfg.slowmodeSegundos}
              render={segLabel}
              onChange={(v) => setCfg((c) => ({ ...c, slowmodeSegundos: v }))}
            />

            <Text style={styles.fieldLabel}>Antigüedad mínima de cuenta</Text>
            <Segments
              options={EDAD}
              value={cfg.edadMinimaHoras}
              render={edadLabel}
              onChange={(v) => setCfg((c) => ({ ...c, edadMinimaHoras: v }))}
            />

            <Text style={styles.fieldLabel}>Máx. menciones por mensaje</Text>
            <Segments
              options={MENCIONES}
              value={cfg.maxMenciones}
              render={(v) => (v === 0 ? 'Sin límite' : String(v))}
              onChange={(v) => setCfg((c) => ({ ...c, maxMenciones: v }))}
            />

            <Text style={styles.fieldLabel}>Adjuntos permitidos</Text>
            <Segments
              options={ADJUNTOS.map((a) => a.value)}
              value={cfg.adjuntosPermitidos}
              render={(v) => ADJUNTOS.find((a) => a.value === v)?.label ?? v}
              onChange={(v) => setCfg((c) => ({ ...c, adjuntosPermitidos: v }))}
            />

            <Text style={styles.fieldLabel}>Anti-raid — ingresos que disparan el bloqueo</Text>
            <Segments
              options={RAID_UMBRAL}
              value={cfg.raidUmbralJoins}
              render={(v) => (v === 0 ? 'Off' : String(v))}
              onChange={(v) => setCfg((c) => ({ ...c, raidUmbralJoins: v }))}
            />
            {cfg.raidUmbralJoins > 0 ? (
              <>
                <Text style={styles.fieldLabel}>Ventana</Text>
                <Segments
                  options={RAID_VENTANA}
                  value={cfg.raidVentanaSegundos}
                  render={segLabel}
                  onChange={(v) => setCfg((c) => ({ ...c, raidVentanaSegundos: v }))}
                />
                <Text style={styles.fieldLabel}>Pausar ingresos por</Text>
                <Segments
                  options={RAID_COOLDOWN}
                  value={cfg.raidCooldownSegundos}
                  render={segLabel}
                  onChange={(v) => setCfg((c) => ({ ...c, raidCooldownSegundos: v }))}
                />
              </>
            ) : null}

            {bloqueadoRaid ? (
              <View style={styles.raidLock}>
                <Text style={styles.raidLockText}>Ingresos bloqueados por anti-raid.</Text>
                <Pressable
                  onPress={() =>
                    levantarBloqueoRaid(serverId)
                      .then(() => setCfg((c) => ({ ...c, raidBloqueadoHasta: null })))
                      .catch((err) => showAppAlert('Error', getErrorMessage(err)))
                  }
                >
                  <Text style={styles.raidLockAction}>Levantar</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              style={[styles.saveBtn, savingCfg && styles.saveBtnDisabled]}
              onPress={guardarAutomod}
              disabled={savingCfg}
            >
              <Text style={styles.saveBtnText}>{savingCfg ? 'Guardando…' : 'Guardar AutoMod'}</Text>
            </Pressable>
          </View>
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xs },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionGap: { marginTop: spacing.lg },
  radio: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  radioActive: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.06)' },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  radioLabel: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  radioDesc: { color: colors.mutedForeground, fontSize: fontSize.xs, marginTop: 2 },
  note: { color: colors.mutedForeground, fontSize: fontSize.sm, marginVertical: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
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
  inputMultiline: { minHeight: 90, textAlignVertical: 'top' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  segRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  seg: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  segActive: { borderColor: colors.primary, backgroundColor: 'rgba(99,102,241,0.12)' },
  segText: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '600' },
  segTextActive: { color: colors.foreground },
  raidLock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.xs,
  },
  raidLockText: { color: colors.destructive, fontSize: fontSize.xs },
  raidLockAction: { color: colors.destructive, fontSize: fontSize.xs, fontWeight: '700' },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '700' },
})
