import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Avatar } from '@/components/Avatar'
import { ScreenContainer } from '@/components/ScreenContainer'
import { UserBadge } from '@/components/UserBadge'
import { showAppAlert } from '@/hooks/use-app-alert'
import { useAuth } from '@/hooks/use-auth'
import { useStaffCaps } from '@/hooks/use-staff-caps'
import { formatFullDate, relativeTime } from '@/lib/internal/core-utils'
import {
  aplicarSancion,
  asignarRolStaff,
  listarRolesStaffUsuario,
  listarSancionesUsuario,
  quitarRolStaff,
  revocarSancion,
  type EstadoCuenta,
  type RolStaff,
  type SancionConAutor,
  type TipoRolStaff,
  type TipoSancion,
} from '@/lib/moderation'
import { ETIQUETA_ROL_STAFF, ETIQUETA_TIPO_SANCION } from '@/lib/moderation-display'
import { suscribirseAlPanelStaff } from '@/lib/realtime-avisos'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import { EstadoCuentaChip, Etiqueta, FiltroChip, TituloSeccion, staffStyles } from '@/screens/staff/staff-ui'

const DURACIONES: { label: string; minutos: number }[] = [
  { label: '1 hora', minutos: 60 },
  { label: '1 día', minutos: 60 * 24 },
  { label: '7 días', minutos: 60 * 24 * 7 },
  { label: '30 días', minutos: 60 * 24 * 30 },
]

const TIPOS_SANCION: TipoSancion[] = ['advertencia', 'ban_temporal', 'ban_permanente']
const TIPOS_ROL: TipoRolStaff[] = ['moderador', 'frontend_dev', 'core_dev']

function derivarEstado(sanciones: SancionConAutor[]): EstadoCuenta {
  const ahora = Date.now()
  if (sanciones.some((s) => s.activa && s.tipo === 'ban_permanente')) return 'ban_permanente'
  if (
    sanciones.some(
      (s) => s.activa && s.tipo === 'ban_temporal' && (!s.expiraAt || new Date(s.expiraAt).getTime() > ahora)
    )
  ) {
    return 'ban_temporal'
  }
  if (sanciones.some((s) => s.activa && s.tipo === 'advertencia')) return 'advertido'
  return 'activo'
}

export function StaffUserScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'StaffUser'>>()
  const { user } = useAuth()
  const caps = useStaffCaps(user?.id)
  const [sanciones, setSanciones] = useState<SancionConAutor[] | null>(null)
  const [roles, setRoles] = useState<RolStaff[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sancionAbierta, setSancionAbierta] = useState(false)
  const [rolesAbierto, setRolesAbierto] = useState(false)

  const cargar = useCallback(() => {
    listarSancionesUsuario(params.id)
      .then((d) => {
        setSanciones(d)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err)))
    listarRolesStaffUsuario(params.id)
      .then(setRoles)
      .catch(() => setRoles([]))
  }, [params.id])

  useEffect(() => {
    cargar()
    return suscribirseAlPanelStaff(cargar)
  }, [cargar])

  function revocar(sancion: SancionConAutor) {
    showAppAlert('Revocar sanción', `¿Revocar la ${ETIQUETA_TIPO_SANCION[sancion.tipo].toLowerCase()}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Revocar',
        style: 'destructive',
        onPress: async () => {
          try {
            await revocarSancion(sancion.id)
            cargar()
          } catch (err) {
            showAppAlert('Error', getErrorMessage(err))
          }
        },
      },
    ])
  }

  const esPropio = user?.id === params.id

  return (
    <ScreenContainer>
      <View style={staffStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={staffStyles.headerTitulo} numberOfLines={1}>
          {params.nombre}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={[staffStyles.card, staffStyles.fila]}>
          <Avatar name={params.nombre} url={params.avatarUrl ?? undefined} size={52} />
          <View style={styles.flex}>
            <View style={styles.filaChica}>
              <Text style={staffStyles.nombre}>{params.nombre}</Text>
              <UserBadge userId={params.id} size={15} />
            </View>
            <View style={[styles.filaChica, { marginTop: 4 }]}>
              {sanciones ? <EstadoCuentaChip estado={derivarEstado(sanciones)} /> : null}
              {roles?.map((r) => (
                <Etiqueta key={r.tipo} texto={ETIQUETA_ROL_STAFF[r.tipo]} color={colors.primary} />
              ))}
            </View>
          </View>
        </View>

        {!esPropio ? (
          <View style={styles.botones}>
            {caps.canGestionarSanciones ? (
              <Pressable style={[staffStyles.boton, styles.flex, { backgroundColor: colors.destructive }]} onPress={() => setSancionAbierta(true)}>
                <Text style={staffStyles.botonTexto}>Sancionar</Text>
              </Pressable>
            ) : null}
            {caps.esAdmin ? (
              <Pressable style={[staffStyles.botonSecundario, styles.flex]} onPress={() => setRolesAbierto(true)}>
                <Text style={staffStyles.botonSecundarioTexto}>Rol de staff</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <TituloSeccion>Historial de sanciones</TituloSeccion>
        {error ? <Text style={staffStyles.error}>{error}</Text> : null}
        {!sanciones && !error ? <ActivityIndicator color={colors.primary} /> : null}
        {sanciones && sanciones.length === 0 ? <Text style={staffStyles.vacio}>Sin sanciones registradas.</Text> : null}
        {sanciones?.map((s) => (
          <View key={s.id} style={staffStyles.card}>
            <View style={styles.filaEntre}>
              <Text style={staffStyles.nombre}>{ETIQUETA_TIPO_SANCION[s.tipo]}</Text>
              <Etiqueta
                texto={s.activa ? 'Activa' : 'Revocada'}
                color={s.activa ? colors.destructive : colors.mutedForeground}
              />
            </View>
            <Text style={staffStyles.texto}>{s.motivo}</Text>
            <Text style={staffStyles.meta}>
              {relativeTime(s.creadoAt)}
              {s.aplicadoPorNombre ? ` · aplicada por ${s.aplicadoPorNombre}` : ''}
              {s.tipo === 'ban_temporal' && s.expiraAt ? ` · vence ${formatFullDate(s.expiraAt)}` : ''}
            </Text>
            {!s.activa && s.revocadaPorNombre ? (
              <Text style={staffStyles.meta}>
                Revocada por {s.revocadaPorNombre}
                {s.revocadaMotivo ? `: ${s.revocadaMotivo}` : ''}
              </Text>
            ) : null}
            {s.activa && caps.canGestionarSanciones ? (
              <Pressable style={[staffStyles.botonSecundario, styles.revocar]} onPress={() => revocar(s)}>
                <Text style={staffStyles.botonSecundarioTexto}>Revocar</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>

      <SancionModal
        visible={sancionAbierta}
        usuarioId={params.id}
        nombre={params.nombre}
        onClose={() => setSancionAbierta(false)}
        onAplicada={() => {
          setSancionAbierta(false)
          cargar()
        }}
      />
      <RolesModal
        visible={rolesAbierto}
        usuarioId={params.id}
        nombre={params.nombre}
        roles={roles ?? []}
        onClose={() => setRolesAbierto(false)}
        onCambio={cargar}
      />
    </ScreenContainer>
  )
}

function SancionModal({
  visible,
  usuarioId,
  nombre,
  onClose,
  onAplicada,
}: {
  visible: boolean
  usuarioId: string
  nombre: string
  onClose: () => void
  onAplicada: () => void
}) {
  const [tipo, setTipo] = useState<TipoSancion>('advertencia')
  const [minutos, setMinutos] = useState(DURACIONES[1].minutos)
  const [motivo, setMotivo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function aplicar() {
    if (!motivo.trim()) return
    setBusy(true)
    setError(null)
    try {
      await aplicarSancion(usuarioId, tipo, motivo.trim(), tipo === 'ban_temporal' ? minutos : undefined)
      setMotivo('')
      onAplicada()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hoja}>
          <View style={styles.filaEntre}>
            <Text style={staffStyles.nombre}>Sancionar a {nombre}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.opciones}>
            {TIPOS_SANCION.map((t) => (
              <FiltroChip key={t} label={ETIQUETA_TIPO_SANCION[t]} activo={tipo === t} onPress={() => setTipo(t)} />
            ))}
          </View>
          {tipo === 'ban_temporal' ? (
            <View style={styles.opciones}>
              {DURACIONES.map((d) => (
                <FiltroChip key={d.minutos} label={d.label} activo={minutos === d.minutos} onPress={() => setMinutos(d.minutos)} />
              ))}
            </View>
          ) : null}
          <TextInput
            style={[staffStyles.input, styles.area]}
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Motivo (la persona lo va a ver)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
          />
          {error ? <Text style={staffStyles.error}>{error}</Text> : null}
          <Pressable
            style={[staffStyles.boton, { backgroundColor: colors.destructive }, (busy || !motivo.trim()) && staffStyles.deshabilitado]}
            disabled={busy || !motivo.trim()}
            onPress={aplicar}
          >
            {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={staffStyles.botonTexto}>Aplicar sanción</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function RolesModal({
  visible,
  usuarioId,
  nombre,
  roles,
  onClose,
  onCambio,
}: {
  visible: boolean
  usuarioId: string
  nombre: string
  roles: RolStaff[]
  onClose: () => void
  onCambio: () => void
}) {
  const [tipo, setTipo] = useState<TipoRolStaff>('moderador')
  const [gestionarSanciones, setGestionarSanciones] = useState(true)
  const [verHistorial, setVerHistorial] = useState(true)
  const [gestionarExplorar, setGestionarExplorar] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function elegir(t: TipoRolStaff) {
    setTipo(t)
    setGestionarSanciones(t === 'moderador')
    setVerHistorial(t === 'moderador')
    setGestionarExplorar(false)
  }

  async function asignar() {
    setBusy(true)
    setError(null)
    try {
      await asignarRolStaff(usuarioId, tipo, {
        gestionar_sanciones: gestionarSanciones,
        ver_historial_sanciones: verHistorial,
        gestionar_explorar: gestionarExplorar,
      })
      onCambio()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function quitar(t: TipoRolStaff) {
    setError(null)
    try {
      await quitarRolStaff(usuarioId, t)
      onCambio()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.fondo}>
        <View style={styles.hoja}>
          <View style={styles.filaEntre}>
            <Text style={staffStyles.nombre}>Roles de staff de {nombre}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <Text style={staffStyles.meta}>Roles actuales</Text>
          {roles.length === 0 ? <Text style={staffStyles.meta}>Este usuario no tiene roles de staff.</Text> : null}
          {roles.map((r) => (
            <View key={r.tipo} style={[styles.filaEntre, styles.rol]}>
              <Text style={staffStyles.texto}>{ETIQUETA_ROL_STAFF[r.tipo]}</Text>
              <Pressable onPress={() => quitar(r.tipo)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.destructive} />
              </Pressable>
            </View>
          ))}

          <Text style={[staffStyles.meta, { marginTop: spacing.sm }]}>Asignar o actualizar</Text>
          <View style={styles.opciones}>
            {TIPOS_ROL.map((t) => (
              <FiltroChip key={t} label={ETIQUETA_ROL_STAFF[t]} activo={tipo === t} onPress={() => elegir(t)} />
            ))}
          </View>
          <Permiso label="Gestionar sanciones y reportes" valor={gestionarSanciones} onChange={setGestionarSanciones} />
          <Permiso label="Ver historial de sanciones" valor={verHistorial} onChange={setVerHistorial} />
          <Permiso label="Gestionar Explorar" valor={gestionarExplorar} onChange={setGestionarExplorar} />
          {error ? <Text style={staffStyles.error}>{error}</Text> : null}
          <Pressable style={[staffStyles.boton, busy && staffStyles.deshabilitado]} disabled={busy} onPress={asignar}>
            {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={staffStyles.botonTexto}>Guardar rol</Text>}
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

function Permiso({ label, valor, onChange }: { label: string; valor: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.filaEntre}>
      <Text style={staffStyles.texto}>{label}</Text>
      <Switch value={valor} onValueChange={onChange} trackColor={{ true: colors.primary, false: colors.secondary }} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  filaChica: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  filaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  botones: { flexDirection: 'row', gap: spacing.sm },
  revocar: { alignSelf: 'flex-start', marginTop: 4 },
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  hoja: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  area: { minHeight: 90 },
  rol: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm },
  textoChico: { fontSize: fontSize.xs },
})
