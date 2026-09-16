import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { PromptModal } from '@/components/PromptModal'
import { useAuth } from '@/hooks/use-auth'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  crearExpresion,
  eliminarExpresion,
  listarExpresiones,
  renombrarExpresion,
  type ExpresionTipo,
  type ServerExpresion,
} from '@/lib/expresiones'
import { subirExpresionServidor } from '@/lib/storage'
import { listarServidores } from '@/lib/servers'
import { getErrorMessage } from '@/lib/utils'
import type { ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'Expresiones'>

function nombreDesdeArchivo(uri: string): string {
  const base = uri.split('/').pop()?.replace(/\.[^.]+$/, '') ?? ''
  return base.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 32) || 'expresion'
}

function ExpresionTile({
  expresion,
  canEdit,
  onRename,
  onDelete,
}: {
  expresion: ServerExpresion
  canEdit: boolean
  onRename: (expresion: ServerExpresion) => void
  onDelete: (expresion: ServerExpresion) => void
}) {
  return (
    <View style={styles.tile}>
      {canEdit ? (
        <Pressable
          style={styles.deleteButton}
          onPress={() => onDelete(expresion)}
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={colors.destructive} />
        </Pressable>
      ) : null}

      <Image source={{ uri: expresion.url }} style={styles.tileImage} resizeMode="contain" />

      <Pressable
        style={styles.tileNameRow}
        disabled={!canEdit}
        onPress={() => onRename(expresion)}
        hitSlop={8}
      >
        <Text style={styles.tileName} numberOfLines={1}>
          {expresion.nombre}
        </Text>
        {canEdit ? <Ionicons name="pencil-outline" size={11} color={colors.mutedForeground} /> : null}
      </Pressable>
    </View>
  )
}

export function ExpresionesScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [expresiones, setExpresiones] = useState<ServerExpresion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<ExpresionTipo>('emoji')
  const [uploading, setUploading] = useState(false)
  const [renaming, setRenaming] = useState<ServerExpresion | null>(null)

  useEffect(() => {
    listarServidores()
      .then((servers) => setServer(servers.find((s) => s.id === serverId) ?? null))
      .catch(() => {})
  }, [serverId])

  const cargar = useCallback(() => {
    return listarExpresiones(serverId)
      .then(setExpresiones)
      .catch((err) => setError(getErrorMessage(err)))
  }, [serverId])

  useFocusEffect(
    useCallback(() => {
      cargar().finally(() => setLoading(false))
    }, [cargar])
  )

  const canEdit = Boolean(server && user && server.ownerId === user.id)

  async function handleUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    setUploading(true)
    setError(null)
    try {
      const url = await subirExpresionServidor(serverId, {
        uri: asset.uri,
        name: asset.fileName ?? `expresion.${asset.uri.split('.').pop() ?? 'png'}`,
        type: asset.mimeType ?? 'image/png',
        size: asset.fileSize,
      })
      const nueva = await crearExpresion(serverId, nombreDesdeArchivo(asset.uri), url, tab)
      setExpresiones((prev) => [...prev, nueva])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  async function handleConfirmRename(nombre: string) {
    if (!renaming) return
    const objetivo = renaming
    setRenaming(null)
    try {
      const actualizada = await renombrarExpresion(objetivo.id, nombre)
      setExpresiones((prev) => prev.map((e) => (e.id === objetivo.id ? actualizada : e)))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  function handleDelete(expresion: ServerExpresion) {
    showAppAlert('Eliminar expresión', `¿Eliminar "${expresion.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const previas = expresiones
          setExpresiones((prev) => prev.filter((e) => e.id !== expresion.id))
          try {
            await eliminarExpresion(expresion.id)
          } catch (err) {
            setExpresiones(previas)
            setError(getErrorMessage(err))
          }
        },
      },
    ])
  }

  const visibles = expresiones.filter((e) => e.tipo === tab)

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Expresiones</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabs}>
        {(
          [
            ['emoji', 'Emojis'],
            ['sticker', 'Stickers'],
          ] as const
        ).map(([id, label]) => (
          <Pressable key={id} style={styles.tab} onPress={() => setTab(id)}>
            <Text style={[styles.tabLabel, tab === id && styles.tabLabelActive]}>{label}</Text>
            {tab === id ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {visibles.map((expresion) => (
            <ExpresionTile
              key={expresion.id}
              expresion={expresion}
              canEdit={canEdit}
              onRename={setRenaming}
              onDelete={handleDelete}
            />
          ))}

          {canEdit ? (
            <Pressable style={styles.addTile} onPress={handleUpload} disabled={uploading}>
              {uploading ? (
                <ActivityIndicator color={colors.mutedForeground} />
              ) : (
                <>
                  <Ionicons name="add" size={22} color={colors.mutedForeground} />
                  <Text style={styles.addLabel}>Agregar</Text>
                </>
              )}
            </Pressable>
          ) : null}

          {visibles.length === 0 && !canEdit ? (
            <Text style={styles.empty}>
              Todavía no hay {tab === 'emoji' ? 'emojis' : 'stickers'} personalizados.
            </Text>
          ) : null}
        </ScrollView>
      )}

      {!canEdit && !loading ? (
        <Text style={styles.permissionNote}>No tenés permiso para gestionar expresiones en este servidor.</Text>
      ) : null}

      <PromptModal
        visible={renaming !== null}
        title="Renombrar expresión"
        initialValue={renaming?.nombre ?? ''}
        confirmLabel="Guardar"
        onCancel={() => setRenaming(null)}
        onConfirm={handleConfirmRename}
      />
    </ScreenContainer>
  )
}

const TILE_SIZE = 76

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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.sm,
  },
  tabLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  tabLabelActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
  tabIndicator: {
    height: 2,
    marginTop: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  permissionNote: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  tile: {
    width: TILE_SIZE,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  deleteButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.full,
  },
  tileImage: {
    width: 40,
    height: 40,
  },
  tileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: '100%',
  },
  tileName: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    maxWidth: TILE_SIZE - 16,
  },
  addTile: {
    width: TILE_SIZE,
    height: TILE_SIZE - 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  addLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
})
