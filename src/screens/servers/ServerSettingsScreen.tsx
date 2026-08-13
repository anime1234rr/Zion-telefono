import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { PromptModal } from '@/components/PromptModal'
import { useAuth } from '@/hooks/use-auth'
import { showAppAlert } from '@/hooks/use-app-alert'
import { actualizarServidor, eliminarServidor, listarServidores, regenerarInvitacion } from '@/lib/servers'
import { getErrorMessage } from '@/lib/utils'
import type { ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerSettings'>

function SettingsRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  destructive?: boolean
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={18} color={destructive ? colors.destructive : colors.mutedForeground} />
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
    </Pressable>
  )
}

export function ServerSettingsScreen() {
  const { user } = useAuth()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [renaming, setRenaming] = useState(false)

  useFocusEffect(
    useCallback(() => {
      listarServidores()
        .then((servidores) => setServer(servidores.find((s) => s.id === serverId) ?? null))
        .catch((err) => console.error('No se pudo cargar el servidor', err))
    }, [serverId])
  )

  const isOwner = server && user && server.ownerId === user.id

  async function handleRegenerateInvite() {
    try {
      const updated = await regenerarInvitacion(serverId)
      setServer(updated)
    } catch (err) {
      showAppAlert('Error', getErrorMessage(err))
    }
  }

  function handleDeleteServer() {
    showAppAlert('Eliminar servidor', '¿Seguro que querés eliminar este servidor? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarServidor(serverId)
            navigation.navigate('Main')
          } catch (err) {
            showAppAlert('Error', getErrorMessage(err))
          }
        },
      },
    ])
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Ajustes de {server?.name ?? 'servidor'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GENERAL</Text>
          <SettingsRow icon="pencil-outline" label="Cambiar nombre" onPress={() => setRenaming(true)} />
          {server?.inviteCode ? (
            <SettingsRow icon="refresh-outline" label="Regenerar invitación" onPress={handleRegenerateInvite} />
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMUNIDAD</Text>
          <SettingsRow
            icon="happy-outline"
            label="Expresiones"
            onPress={() => navigation.navigate('Expresiones', { serverId })}
          />
          <SettingsRow
            icon="link-outline"
            label="Webhooks"
            onPress={() => navigation.navigate('Webhooks', { serverId })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MODERACIÓN</Text>
          <SettingsRow
            icon="shield-outline"
            label="Roles y permisos"
            onPress={() => navigation.navigate('Roles', { serverId })}
          />
          <SettingsRow
            icon="document-text-outline"
            label="Registro de auditoría"
            onPress={() => navigation.navigate('AuditLog', { serverId })}
          />
        </View>

        {isOwner ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ZONA DE PELIGRO</Text>
            <SettingsRow icon="trash-outline" label="Eliminar servidor" destructive onPress={handleDeleteServer} />
          </View>
        ) : null}
      </ScrollView>

      <PromptModal
        visible={renaming}
        title="Cambiar nombre del servidor"
        initialValue={server?.name ?? ''}
        onCancel={() => setRenaming(false)}
        onConfirm={async (value) => {
          setRenaming(false)
          try {
            const updated = await actualizarServidor(serverId, { nombre: value })
            setServer(updated)
          } catch (err) {
            showAppAlert('Error', getErrorMessage(err))
          }
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
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  rowLabelDestructive: {
    color: colors.destructive,
  },
})
