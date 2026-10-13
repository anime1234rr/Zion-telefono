import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Avatar } from '@/components/Avatar'
import {
  advertirMiembroRapido,
  asignarRolRapido,
  banearMiembroRapido,
  banearMiembroTemporalRapido,
  cambiarColorRolRapido,
  crearRolRapido,
  kickearMiembroRapido,
  listarRolesDeServidor,
  renombrarRolRapido,
  silenciarMiembroRapido,
  type ServerRole,
} from '@/lib/members'
import { limpiarMensajesRapido } from '@/lib/messages'
import { COLORES } from '@/lib/role-colors'
import { buscarUsuariosEnServidor } from '@/lib/search'
import {
  DURACIONES_MUTE,
  DURACIONES_TEMPBAN,
  SLASH_COMANDOS,
  type SlashCommandStep,
} from '@/lib/slash-commands'
import type { ChatUser } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Paso = 'lista' | SlashCommandStep

const NECESITA_ROL: SlashCommandStep[] = ['renombrar', 'color', 'asignar']
const NECESITA_USUARIO: SlashCommandStep[] = ['asignar', 'kick', 'ban', 'tempban', 'mute', 'warn']

export function SlashCommandSheet({
  visible,
  serverId,
  ownerId,
  channelId,
  currentUserId,
  isOwner,
  hasPermission,
  pasoInicial,
  onClose,
  onResultado,
}: {
  visible: boolean
  serverId: string
  ownerId: string | null
  channelId: string
  currentUserId: string
  isOwner: boolean
  hasPermission: (permiso: string) => boolean
  pasoInicial?: SlashCommandStep | null
  onClose: () => void
  onResultado: (mensaje: string) => void
}) {
  const [pasoElegido, setPaso] = useState<Paso>('lista')
  const [roles, setRoles] = useState<ServerRole[] | null>(null)
  const [rol, setRol] = useState<ServerRole | null>(null)
  const [usuario, setUsuario] = useState<ChatUser | null>(null)
  const [texto, setTexto] = useState('')
  const [color, setColor] = useState(COLORES[0])
  const [minutos, setMinutos] = useState<number>(DURACIONES_MUTE[0].minutos)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const comandos = SLASH_COMANDOS.filter((c) => isOwner || hasPermission(c.permiso))
  const paso: Paso = pasoElegido !== 'lista' && !comandos.some((c) => c.step === pasoElegido) ? 'lista' : pasoElegido

  useEffect(() => {
    if (!visible) return
    setPaso(pasoInicial ?? 'lista')
    setRol(null)
    setUsuario(null)
    setTexto('')
    setError(null)
  }, [visible, pasoInicial])

  useEffect(() => {
    if (paso === 'lista') return
    setRol(null)
    setUsuario(null)
    setTexto(paso === 'clear' ? '25' : '')
    setError(null)
    setMinutos(paso === 'tempban' ? DURACIONES_TEMPBAN[0].minutos : DURACIONES_MUTE[0].minutos)
    if (NECESITA_ROL.includes(paso) && !roles) {
      listarRolesDeServidor(serverId)
        .then((data) => setRoles(data.filter((r) => !r.esRolBase)))
        .catch((err) => setError(getErrorMessage(err)))
    }
  }, [paso, roles, serverId])

  async function ejecutar(accion: () => Promise<string>) {
    setBusy(true)
    setError(null)
    try {
      const mensaje = await accion()
      onResultado(mensaje)
      onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function confirmar() {
    if (paso === 'lista') return
    const nombreUsuario = usuario?.name ?? ''
    switch (paso) {
      case 'crear':
        return ejecutar(async () => `Rol «${(await crearRolRapido(serverId, texto.trim())).nombre}» creado.`)
      case 'renombrar':
        return ejecutar(async () => {
          const r = await renombrarRolRapido(serverId, (rol as ServerRole).id, texto.trim())
          setRoles(null)
          return `Rol renombrado a «${r.nombre}».`
        })
      case 'color':
        return ejecutar(async () => {
          const r = await cambiarColorRolRapido(serverId, (rol as ServerRole).id, color)
          setRoles(null)
          return `Color de «${r.nombre}» actualizado.`
        })
      case 'asignar':
        return ejecutar(async () => {
          await asignarRolRapido(serverId, (usuario as ChatUser).id, (rol as ServerRole).id)
          return `${nombreUsuario} ahora tiene el rol «${(rol as ServerRole).nombre}».`
        })
      case 'kick':
        return ejecutar(async () => {
          await kickearMiembroRapido(serverId, (usuario as ChatUser).id)
          return `${nombreUsuario} fue expulsado.`
        })
      case 'ban':
        return ejecutar(async () => {
          await banearMiembroRapido(serverId, (usuario as ChatUser).id, texto)
          return `${nombreUsuario} fue baneado.`
        })
      case 'tempban':
        return ejecutar(async () => {
          await banearMiembroTemporalRapido(serverId, (usuario as ChatUser).id, minutos, texto)
          return `${nombreUsuario} fue baneado temporalmente.`
        })
      case 'mute':
        return ejecutar(async () => {
          await silenciarMiembroRapido(serverId, (usuario as ChatUser).id, minutos)
          return `${nombreUsuario} fue silenciado.`
        })
      case 'warn':
        return ejecutar(async () => {
          const total = await advertirMiembroRapido(serverId, (usuario as ChatUser).id, texto.trim())
          return `${nombreUsuario} recibió una advertencia (${total} en total).`
        })
      case 'clear':
        return ejecutar(async () => {
          const borrados = await limpiarMensajesRapido(channelId, Number.parseInt(texto, 10))
          return `Se borraron ${borrados} mensajes.`
        })
    }
  }

  const listo =
    paso !== 'lista' &&
    !busy &&
    (!NECESITA_ROL.includes(paso) || rol !== null) &&
    (!NECESITA_USUARIO.includes(paso) || usuario !== null) &&
    (paso !== 'crear' && paso !== 'renombrar' && paso !== 'warn' ? true : texto.trim().length > 0) &&
    (paso !== 'clear' || (Number.parseInt(texto, 10) >= 1 && Number.parseInt(texto, 10) <= 100))

  const actual = comandos.find((c) => c.step === paso)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.fondo} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.flex} onPress={onClose} />
        <View style={styles.hoja}>
          <View style={styles.cabecera}>
            {paso !== 'lista' ? (
              <Pressable onPress={() => setPaso('lista')} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
              </Pressable>
            ) : (
              <Ionicons name="flash-outline" size={20} color={colors.primary} />
            )}
            <Text style={styles.titulo}>{paso === 'lista' ? 'Comandos de staff' : actual?.comando}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={styles.cuerpo} keyboardShouldPersistTaps="handled">
            {paso === 'lista' &&
              (comandos.length === 0 ? (
                <Text style={styles.meta}>No tenés permisos para usar comandos en este servidor.</Text>
              ) : (
                comandos.map((c) => (
                  <Pressable key={c.step} style={styles.comando} onPress={() => setPaso(c.step)}>
                    <Ionicons name={c.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.foreground} />
                    <View style={styles.flex}>
                      <Text style={styles.comandoNombre}>{c.comando}</Text>
                      <Text style={styles.meta}>{c.label}</Text>
                    </View>
                  </Pressable>
                ))
              ))}

            {paso !== 'lista' && NECESITA_USUARIO.includes(paso) && (
              <Seccion titulo="Miembro">
                {usuario ? (
                  <Pressable style={styles.elegido} onPress={() => setUsuario(null)}>
                    <Avatar name={usuario.name} url={usuario.avatarUrl} size={28} />
                    <Text style={[styles.texto, styles.flex]}>{usuario.name}</Text>
                    <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ) : (
                  <SelectorUsuario
                    serverId={serverId}
                    excluir={[currentUserId, ownerId ?? '']}
                    onElegir={setUsuario}
                  />
                )}
              </Seccion>
            )}

            {paso !== 'lista' && NECESITA_ROL.includes(paso) && (
              <Seccion titulo="Rol">
                {!roles && !error ? <ActivityIndicator color={colors.primary} /> : null}
                {roles && roles.length === 0 ? <Text style={styles.meta}>Este servidor todavía no tiene roles.</Text> : null}
                {roles?.map((r) => (
                  <Pressable key={r.id} style={[styles.rol, rol?.id === r.id && styles.rolActivo]} onPress={() => setRol(r)}>
                    <View style={[styles.punto, { backgroundColor: r.color ?? colors.mutedForeground }]} />
                    <Text style={styles.texto}>{r.nombre}</Text>
                  </Pressable>
                ))}
              </Seccion>
            )}

            {(paso === 'crear' || paso === 'renombrar') && (
              <Seccion titulo={paso === 'crear' ? 'Nombre del rol' : 'Nombre nuevo'}>
                <TextInput style={styles.input} value={texto} onChangeText={setTexto} maxLength={32} placeholderTextColor={colors.mutedForeground} placeholder="Moderadores" />
              </Seccion>
            )}

            {paso === 'color' && (
              <Seccion titulo="Color">
                <View style={styles.colores}>
                  {COLORES.map((c) => (
                    <Pressable
                      key={c}
                      style={[styles.color, { backgroundColor: c }, color === c && styles.colorActivo]}
                      onPress={() => setColor(c)}
                    />
                  ))}
                </View>
              </Seccion>
            )}

            {(paso === 'mute' || paso === 'tempban') && (
              <Seccion titulo="Duración">
                <View style={styles.chips}>
                  {(paso === 'mute' ? DURACIONES_MUTE : DURACIONES_TEMPBAN).map((d) => (
                    <Pressable
                      key={d.minutos}
                      style={[styles.chip, minutos === d.minutos && styles.chipActivo]}
                      onPress={() => setMinutos(d.minutos)}
                    >
                      <Text style={[styles.chipTexto, minutos === d.minutos && styles.chipTextoActivo]}>{d.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </Seccion>
            )}

            {(paso === 'ban' || paso === 'tempban' || paso === 'warn') && (
              <Seccion titulo={paso === 'warn' ? 'Razón' : 'Razón (opcional)'}>
                <TextInput
                  style={[styles.input, styles.area]}
                  value={texto}
                  onChangeText={setTexto}
                  multiline
                  textAlignVertical="top"
                  placeholder="Por qué se aplica"
                  placeholderTextColor={colors.mutedForeground}
                />
              </Seccion>
            )}

            {paso === 'clear' && (
              <Seccion titulo="Cantidad de mensajes (1 a 100)">
                <TextInput
                  style={styles.input}
                  value={texto}
                  onChangeText={(t) => setTexto(t.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </Seccion>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </ScrollView>

          {paso !== 'lista' ? (
            <Pressable style={[styles.boton, !listo && styles.deshabilitado]} disabled={!listo} onPress={confirmar}>
              {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.botonTexto}>Ejecutar</Text>}
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo.toUpperCase()}</Text>
      {children}
    </View>
  )
}

function SelectorUsuario({
  serverId,
  excluir,
  onElegir,
}: {
  serverId: string
  excluir: string[]
  onElegir: (u: ChatUser) => void
}) {
  const [query, setQuery] = useState('')
  const [sugerencias, setSugerencias] = useState<ChatUser[]>([])
  const excluidos = excluir.join(',')

  useEffect(() => {
    if (!query.trim()) return
    let cancelado = false
    const ids = excluidos.split(',')
    const t = setTimeout(() => {
      buscarUsuariosEnServidor(serverId, query)
        .then((r) => !cancelado && setSugerencias(r.filter((u) => !ids.includes(u.id))))
        .catch(() => !cancelado && setSugerencias([]))
    }, 200)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [query, serverId, excluidos])

  return (
    <View style={styles.seccion}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar miembro por nombre…"
        placeholderTextColor={colors.mutedForeground}
        autoCapitalize="none"
        autoFocus
      />
      {(query.trim() ? sugerencias : []).map((u) => (
        <Pressable key={u.id} style={styles.elegido} onPress={() => onElegir(u)}>
          <Avatar name={u.name} url={u.avatarUrl} size={28} />
          <Text style={styles.texto}>{u.name}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fondo: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  hoja: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  titulo: { flex: 1, color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  cuerpo: { flexGrow: 0 },
  comando: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  comandoNombre: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600', fontFamily: 'monospace' },
  meta: { color: colors.mutedForeground, fontSize: fontSize.xs },
  texto: { color: colors.foreground, fontSize: fontSize.md },
  seccion: { gap: spacing.xs, marginBottom: spacing.sm },
  seccionTitulo: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '700' },
  elegido: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  rol: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.sm },
  rolActivo: { backgroundColor: colors.secondary },
  punto: { width: 12, height: 12, borderRadius: 6 },
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
  area: { minHeight: 80 },
  colores: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  color: { width: 34, height: 34, borderRadius: 17 },
  colorActivo: { borderWidth: 3, borderColor: colors.foreground },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 6 },
  chipActivo: { borderColor: colors.primary, backgroundColor: alfa(colors.primary, 0.12) },
  chipTexto: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '600' },
  chipTextoActivo: { color: colors.foreground },
  error: { color: colors.destructive, fontSize: fontSize.sm },
  boton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  botonTexto: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '600' },
  deshabilitado: { opacity: 0.5 },
})
