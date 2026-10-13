import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Avatar } from '@/components/Avatar'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  actualizarApodoMiembro,
  agregarRolMiembro,
  banearMiembro,
  displayMemberName,
  expulsarMiembro,
  listarRolesDeServidor,
  quitarRolMiembro,
  quitarSilencioMiembro,
  silenciarMiembro,
  type ServerMember,
  type ServerRole,
} from '@/lib/members'
import { formatFullDate } from '@/lib/internal/core-utils'
import { getErrorMessage } from '@/lib/utils'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export interface PermisosMiembro {
  roles: boolean
  apodos: boolean
  silenciar: boolean
  expulsar: boolean
  banear: boolean
}

type Vista = 'menu' | 'apodo' | 'roles' | 'silenciar' | 'banear'

const DURACIONES_SILENCIO = [
  { label: '60 segundos', minutos: 1 },
  { label: '5 minutos', minutos: 5 },
  { label: '10 minutos', minutos: 10 },
  { label: '1 hora', minutos: 60 },
  { label: '1 día', minutos: 60 * 24 },
  { label: '1 semana', minutos: 60 * 24 * 7 },
]

const DURACIONES_BAN = [
  { label: 'Permanente', minutos: undefined as number | undefined },
  { label: '1 día', minutos: 60 * 24 },
  { label: '7 días', minutos: 60 * 24 * 7 },
  { label: '30 días', minutos: 60 * 24 * 30 },
]

export function MemberActionsSheet({
  member,
  serverId,
  permisos,
  onClose,
  onVerPerfil,
  onCambio,
}: {
  member: ServerMember | null
  serverId: string
  permisos: PermisosMiembro
  onClose: () => void
  onVerPerfil: (userId: string) => void
  onCambio: () => void
}) {
  const [vista, setVista] = useState<Vista>('menu')
  const [apodo, setApodo] = useState('')
  const [razon, setRazon] = useState('')
  const [banMinutos, setBanMinutos] = useState<number | undefined>(undefined)
  const [roles, setRoles] = useState<ServerRole[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!member) return
    setVista('menu')
    setApodo(member.nickname ?? '')
    setRazon('')
    setBanMinutos(undefined)
    setError(null)
  }, [member])

  useEffect(() => {
    if (vista !== 'roles' || roles) return
    listarRolesDeServidor(serverId)
      .then((data) => setRoles(data.filter((r) => !r.esRolBase)))
      .catch((err) => setError(getErrorMessage(err)))
  }, [vista, roles, serverId])

  if (!member) return null
  const nombre = displayMemberName(member)
  const silenciado = !!member.silencedUntil && new Date(member.silencedUntil).getTime() > Date.now()

  async function ejecutar(accion: () => Promise<void>, cerrar = true) {
    setBusy(true)
    setError(null)
    try {
      await accion()
      onCambio()
      if (cerrar) onClose()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function confirmarExpulsion() {
    if (!member) return
    const membershipId = member.membershipId
    showAppAlert('Expulsar miembro', `¿Expulsar a ${nombre}? Va a poder volver a unirse con una invitación.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Expulsar', style: 'destructive', onPress: () => ejecutar(() => expulsarMiembro(membershipId)) },
    ])
  }

  const tieneRol = (rolId: string) => member.roles.some((r) => r.id === rolId)

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.fondo} onPress={onClose}>
        <Pressable style={styles.hoja} onPress={() => {}}>
          <View style={styles.cabecera}>
            {vista !== 'menu' ? (
              <Pressable onPress={() => setVista('menu')} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={colors.foreground} />
              </Pressable>
            ) : (
              <Avatar name={member.user.name} url={member.user.avatarUrl} size={40} status={member.user.status} />
            )}
            <View style={styles.flex}>
              <Text style={styles.nombre} numberOfLines={1}>
                {nombre}
              </Text>
              <Text style={styles.meta}>Miembro desde {formatFullDate(member.joinedAt)}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {vista === 'menu' && (
            <View>
              <Opcion icon="person-outline" label="Ver perfil" onPress={() => onVerPerfil(member.user.id)} />
              {permisos.apodos ? <Opcion icon="pricetag-outline" label="Cambiar apodo" onPress={() => setVista('apodo')} /> : null}
              {permisos.roles ? <Opcion icon="ribbon-outline" label="Roles" onPress={() => setVista('roles')} /> : null}
              {permisos.silenciar ? (
                silenciado ? (
                  <Opcion
                    icon="volume-high-outline"
                    label="Quitar silencio"
                    detalle={`Silenciado hasta ${formatFullDate(member.silencedUntil as string)}`}
                    onPress={() => ejecutar(() => quitarSilencioMiembro(member.membershipId))}
                  />
                ) : (
                  <Opcion icon="volume-mute-outline" label="Silenciar" onPress={() => setVista('silenciar')} />
                )
              ) : null}
              {permisos.expulsar ? (
                <Opcion icon="exit-outline" label="Expulsar" peligro onPress={confirmarExpulsion} />
              ) : null}
              {permisos.banear ? <Opcion icon="ban-outline" label="Banear" peligro onPress={() => setVista('banear')} /> : null}
            </View>
          )}

          {vista === 'apodo' && (
            <View style={styles.formulario}>
              <TextInput
                style={styles.input}
                value={apodo}
                onChangeText={setApodo}
                placeholder={member.user.name}
                placeholderTextColor={colors.mutedForeground}
                maxLength={32}
                autoFocus
              />
              <Text style={styles.meta}>Dejalo vacío para quitar el apodo.</Text>
              <Boton
                label="Guardar apodo"
                busy={busy}
                onPress={() => ejecutar(() => actualizarApodoMiembro(member.membershipId, apodo.trim()))}
              />
            </View>
          )}

          {vista === 'roles' && (
            <ScrollView style={styles.lista}>
              {!roles ? <ActivityIndicator color={colors.primary} /> : null}
              {roles && roles.length === 0 ? <Text style={styles.meta}>Este servidor no tiene roles creados.</Text> : null}
              {roles?.map((rol) => {
                const activo = tieneRol(rol.id)
                return (
                  <Pressable
                    key={rol.id}
                    style={styles.rol}
                    disabled={busy}
                    onPress={() =>
                      ejecutar(
                        () =>
                          activo
                            ? quitarRolMiembro(member.membershipId, rol.id)
                            : agregarRolMiembro(member.membershipId, rol.id),
                        false
                      )
                    }
                  >
                    <View style={[styles.punto, { backgroundColor: rol.color ?? colors.mutedForeground }]} />
                    <Text style={[styles.textoOpcion, styles.flex]}>{rol.nombre}</Text>
                    <Ionicons
                      name={activo ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={activo ? colors.primary : colors.mutedForeground}
                    />
                  </Pressable>
                )
              })}
            </ScrollView>
          )}

          {vista === 'silenciar' && (
            <View>
              {DURACIONES_SILENCIO.map((d) => (
                <Opcion
                  key={d.minutos}
                  icon="time-outline"
                  label={d.label}
                  onPress={() => ejecutar(() => silenciarMiembro(member.membershipId, d.minutos))}
                />
              ))}
            </View>
          )}

          {vista === 'banear' && (
            <View style={styles.formulario}>
              <View style={styles.chips}>
                {DURACIONES_BAN.map((d) => (
                  <Pressable
                    key={d.label}
                    style={[styles.chip, banMinutos === d.minutos && styles.chipActivo]}
                    onPress={() => setBanMinutos(d.minutos)}
                  >
                    <Text style={[styles.chipTexto, banMinutos === d.minutos && styles.chipTextoActivo]}>{d.label}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={[styles.input, styles.area]}
                value={razon}
                onChangeText={setRazon}
                placeholder="Razón (opcional, queda en el registro de auditoría)"
                placeholderTextColor={colors.mutedForeground}
                multiline
                textAlignVertical="top"
              />
              <Boton
                label={`Banear a ${nombre}`}
                peligro
                busy={busy}
                onPress={() =>
                  ejecutar(() => banearMiembro(member.membershipId, razon.trim() || undefined, banMinutos))
                }
              />
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

function Opcion({
  icon,
  label,
  detalle,
  peligro,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  detalle?: string
  peligro?: boolean
  onPress: () => void
}) {
  const color = peligro ? colors.destructive : colors.foreground
  return (
    <Pressable style={({ pressed }) => [styles.opcion, pressed && styles.opcionPresionada]} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <View style={styles.flex}>
        <Text style={[styles.textoOpcion, { color }]}>{label}</Text>
        {detalle ? <Text style={styles.meta}>{detalle}</Text> : null}
      </View>
    </Pressable>
  )
}

function Boton({ label, busy, peligro, onPress }: { label: string; busy: boolean; peligro?: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.boton, peligro && { backgroundColor: colors.destructive }, busy && styles.deshabilitado]}
      disabled={busy}
      onPress={onPress}
    >
      {busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.botonTexto}>{label}</Text>}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  hoja: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xs },
  nombre: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  meta: { color: colors.mutedForeground, fontSize: fontSize.xs },
  error: { color: colors.destructive, fontSize: fontSize.sm },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  opcionPresionada: { backgroundColor: colors.secondary },
  textoOpcion: { color: colors.foreground, fontSize: fontSize.md },
  formulario: { gap: spacing.sm },
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
  lista: { maxHeight: 360 },
  rol: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  punto: { width: 12, height: 12, borderRadius: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActivo: { borderColor: colors.destructive, backgroundColor: alfa(colors.destructive, 0.12) },
  chipTexto: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '600' },
  chipTextoActivo: { color: colors.foreground },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  botonTexto: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '600' },
  deshabilitado: { opacity: 0.6 },
})
