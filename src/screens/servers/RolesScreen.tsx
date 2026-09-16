import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
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
import {
  CATEGORIAS_PERMISOS,
  PERMISOS_CONOCIDOS,
  ROLE_PRESETS,
  actualizarRol,
  crearRol,
  eliminarRol,
  listarRolesDeServidor,
  reordenarRoles,
  suscribirseARolesDeServidor,
  type ServerRole,
} from '@/lib/members'
import { COLORES } from '@/lib/role-colors'
import { listarServidores } from '@/lib/servers'
import { getErrorMessage } from '@/lib/utils'
import type { ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Roles'>

function RoleEditorModal({
  visible,
  servidorId,
  role,
  canEdit,
  nextPosicion,
  onClose,
  onSaved,
  onDeleted,
}: {
  visible: boolean
  servidorId: string
  role: ServerRole | null
  canEdit: boolean
  nextPosicion: number
  onClose: () => void
  onSaved: (role: ServerRole) => void
  onDeleted: (roleId: string) => void
}) {
  const [nombre, setNombre] = useState('')
  const [color, setColor] = useState(COLORES[0])
  const [permisos, setPermisos] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setNombre(role?.nombre ?? 'nuevo rol')
    setColor(role?.color ?? COLORES[0])
    setPermisos(role?.permisos ?? {})
    setError(null)
  }, [visible, role])

  function togglePermiso(key: string, checked: boolean) {
    setPermisos((prev) => ({ ...prev, [key]: checked }))
  }

  async function handleSubmit() {
    if (!nombre.trim()) return
    setSaving(true)
    setError(null)
    try {
      const saved = role
        ? await actualizarRol(role.id, { nombre, color, permisos })
        : await crearRol(servidorId, nombre, color, permisos, nextPosicion)
      onSaved(saved)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  function handleDelete() {
    if (!role) return
    showAppAlert('Eliminar rol', `¿Eliminar el rol "${role.nombre}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          setSaving(true)
          try {
            await eliminarRol(role.id)
            onDeleted(role.id)
          } catch (err) {
            setError(getErrorMessage(err))
            setSaving(false)
          }
        },
      },
    ])
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.editorCard}>
          <View style={styles.editorHeader}>
            <View style={styles.editorHeaderText}>
              <Text style={styles.editorEyebrow}>{role ? 'Configurando rol' : 'Nuevo rol'}</Text>
              <Text style={styles.editorTitle} numberOfLines={1}>
                {nombre.trim() || 'Sin nombre'}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={styles.editorScroll} keyboardShouldPersistTaps="handled">
            {!role ? (
              <>
                <Text style={styles.fieldLabel}>Empezar desde una plantilla (opcional)</Text>
                <View style={styles.presetRow}>
                  {ROLE_PRESETS.map((preset) => (
                    <Pressable
                      key={preset.id}
                      style={styles.presetChip}
                      onPress={() => {
                        setNombre(preset.nombre)
                        setColor(preset.color)
                        setPermisos(preset.permisos)
                      }}
                    >
                      <View style={[styles.presetDot, { backgroundColor: preset.color }]} />
                      <Text style={styles.presetLabel}>{preset.nombre}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            <Text style={styles.fieldLabel}>Identidad</Text>
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="nuevo rol"
              placeholderTextColor={colors.mutedForeground}
              selectionColor={colors.primary}
              cursorColor={colors.primary}
              editable={canEdit}
            />

            <Text style={styles.fieldLabel}>Color del rol</Text>
            <View style={styles.colorRow}>
              {COLORES.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }]}
                  disabled={!canEdit}
                  onPress={() => setColor(c)}
                >
                  {color.toLowerCase() === c.toLowerCase() ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Permisos</Text>
            {CATEGORIAS_PERMISOS.map((categoria) => {
              const permisosDeCategoria = PERMISOS_CONOCIDOS.filter((p) => p.categoria === categoria.id)
              return (
                <View key={categoria.id} style={styles.permCategory}>
                  <Text style={styles.permCategoryTitle}>
                    {categoria.icon} {categoria.label}
                  </Text>
                  {permisosDeCategoria.map((permiso) => (
                    <View key={permiso.key} style={styles.permRow}>
                      <Text style={styles.permLabel}>{permiso.label}</Text>
                      <Switch
                        value={Boolean(permisos[permiso.key])}
                        onValueChange={(checked) => togglePermiso(permiso.key, checked)}
                        disabled={!canEdit}
                        trackColor={{ true: colors.primary, false: colors.secondary }}
                      />
                    </View>
                  ))}
                </View>
              )
            })}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {!canEdit ? (
              <Text style={styles.permissionNote}>
                Solo podés ver este rol — no tenés permiso para modificarlo.
              </Text>
            ) : null}
          </ScrollView>

          {canEdit ? (
            <View style={styles.editorFooter}>
              {role ? (
                <Pressable style={styles.deleteLink} onPress={handleDelete} disabled={saving}>
                  <Text style={styles.deleteLinkLabel}>Eliminar rol</Text>
                </Pressable>
              ) : (
                <View />
              )}
              <Pressable
                style={[styles.confirmButton, (saving || !nombre.trim()) && styles.buttonDisabled]}
                disabled={saving || !nombre.trim()}
                onPress={handleSubmit}
              >
                <Text style={styles.confirmLabel}>
                  {saving ? 'Guardando…' : role ? 'Guardar cambios' : 'Crear rol'}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  )
}

export function RolesScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [roles, setRoles] = useState<ServerRole[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ServerRole | 'new' | null>(null)

  useEffect(() => {
    listarServidores()
      .then((servers) => setServer(servers.find((s) => s.id === serverId) ?? null))
      .catch(() => {})
  }, [serverId])

  const cargar = useCallback(() => {
    return listarRolesDeServidor(serverId)
      .then(setRoles)
      .catch((err) => setError(getErrorMessage(err)))
  }, [serverId])

  useFocusEffect(
    useCallback(() => {
      cargar().finally(() => setLoading(false))
    }, [cargar])
  )

  useEffect(() => {
    return suscribirseARolesDeServidor(serverId, cargar)
  }, [serverId, cargar])

  const canEdit = Boolean(server && user && server.ownerId === user.id)

  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= roles.length) return

    const previas = roles
    const reordenados = [...roles]
    const [moved] = reordenados.splice(index, 1)
    reordenados.splice(targetIndex, 0, moved)
    setRoles(reordenados)
    setReorderError(null)

    reordenarRoles(reordenados.map((role, i) => ({ id: role.id, posicion: i }))).catch((err) => {
      setRoles(previas)
      setReorderError(getErrorMessage(err))
    })
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Roles y permisos</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          Definí la jerarquía de rangos de {server?.name ?? 'este servidor'}, sus colores y qué
          puede hacer cada uno.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {reorderError ? <Text style={styles.error}>{reorderError}</Text> : null}

        {canEdit ? (
          <Pressable style={styles.createButton} onPress={() => setSelected('new')}>
            <Ionicons name="add" size={16} color={colors.mutedForeground} />
            <Text style={styles.createButtonLabel}>Crear rol</Text>
          </Pressable>
        ) : null}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : (
          <View style={styles.list}>
            {roles.length === 0 ? (
              <Text style={styles.empty}>El servidor arranca sin roles. Creá el primero.</Text>
            ) : null}

            {roles.map((role, index) => (
              <Pressable key={role.id} style={styles.roleRow} onPress={() => setSelected(role)}>
                <View style={[styles.roleColorBar, { backgroundColor: role.color ?? colors.mutedForeground }]} />
                <Text style={styles.roleName} numberOfLines={1}>
                  {role.nombre}
                </Text>
                {canEdit ? (
                  <View style={styles.reorderButtons}>
                    <Pressable
                      style={styles.reorderButton}
                      disabled={index === 0}
                      onPress={() => move(index, -1)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={16}
                        color={index === 0 ? colors.border : colors.mutedForeground}
                      />
                    </Pressable>
                    <Pressable
                      style={styles.reorderButton}
                      disabled={index === roles.length - 1}
                      onPress={() => move(index, 1)}
                      hitSlop={6}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={16}
                        color={index === roles.length - 1 ? colors.border : colors.mutedForeground}
                      />
                    </Pressable>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}

        {!canEdit && !loading ? (
          <Text style={styles.permissionNote}>No tenés permiso para gestionar roles en este servidor.</Text>
        ) : null}
      </ScrollView>

      <RoleEditorModal
        visible={selected !== null}
        servidorId={serverId}
        role={selected === 'new' ? null : selected}
        canEdit={canEdit}
        nextPosicion={roles.length}
        onClose={() => setSelected(null)}
        onSaved={(role) => {
          setRoles((prev) => {
            const exists = prev.some((r) => r.id === role.id)
            return exists ? prev.map((r) => (r.id === role.id ? role : r)) : [...prev, role]
          })
          setSelected(null)
        }}
        onDeleted={(roleId) => {
          setRoles((prev) => prev.filter((r) => r.id !== roleId))
          setSelected(null)
        }}
      />
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
  content: {
    padding: spacing.lg,
  },
  description: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  createButtonLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  loading: {
    marginTop: spacing.xl,
  },
  list: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  roleColorBar: {
    width: 4,
    height: 22,
    borderRadius: radius.full,
  },
  roleName: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  reorderButtons: {
    gap: 2,
  },
  reorderButton: {
    width: 24,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionNote: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    marginTop: spacing.lg,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  editorCard: {
    maxHeight: '88%',
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  editorHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  editorEyebrow: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  editorTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginTop: 2,
  },
  editorScroll: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  fieldLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  presetDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  presetLabel: {
    color: colors.foreground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.foreground,
    fontSize: fontSize.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permCategory: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  permCategoryTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  permLabel: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  editorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  deleteLink: {
    paddingVertical: spacing.xs,
  },
  deleteLinkLabel: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  confirmLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
})
