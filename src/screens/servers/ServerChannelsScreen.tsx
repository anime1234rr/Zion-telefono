import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { ChannelListItem } from '@/components/ChannelListItem'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/use-auth'
import { listarCanales, suscribirseACanalesDeServidor, UNCATEGORIZED_ID } from '@/lib/channels'
import { listarServidores } from '@/lib/servers'
import { listarCanalesNoLeidos } from '@/lib/read-state'
import { contarMencionesNoLeidas } from '@/lib/notifications'
import {
  listarParticipantesDeVozDelServidor,
  suscribirseAEstadosVozGlobal,
  type VoiceParticipant,
} from '@/lib/voice'
import type { ChannelCategory, ChannelItem, ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerChannels'>

export function ServerChannelsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const { user } = useAuth()
  const [server, setServer] = useState<ServerItem | null>(null)
  const [categories, setCategories] = useState<ChannelCategory[]>([])
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set())
  const [mentionsPorCanal, setMentionsPorCanal] = useState<Map<string, number>>(new Map())
  const [enVoz, setEnVoz] = useState<Map<string, VoiceParticipant[]>>(new Map())

  const cargarVoz = useCallback(() => {
    listarParticipantesDeVozDelServidor(serverId)
      .then((participantes) => {
        const mapa = new Map<string, VoiceParticipant[]>()
        for (const p of participantes) {
          mapa.set(p.canalId, [...(mapa.get(p.canalId) ?? []), p])
        }
        setEnVoz(mapa)
      })
      .catch(() => {})
  }, [serverId])

  useEffect(() => {
    cargarVoz()
    const dejarDeEscuchar = suscribirseAEstadosVozGlobal(cargarVoz)
    const intervalo = setInterval(cargarVoz, 30_000)
    return () => {
      dejarDeEscuchar()
      clearInterval(intervalo)
    }
  }, [cargarVoz])

  const cargarCanales = useCallback(() => {
    listarCanales(serverId)
      .then(setCategories)
      .catch((err) => console.error('No se pudieron cargar los canales', err))
  }, [serverId])

  const cargarNoLeidos = useCallback(() => {
    listarCanalesNoLeidos(serverId)
      .then((mapa) => setUnreadIds(new Set(mapa.keys())))
      .catch(() => {})
    if (user?.id) {
      contarMencionesNoLeidas(user.id)
        .then((r) => setMentionsPorCanal(r.porCanal))
        .catch(() => {})
    }
  }, [serverId, user?.id])

  useFocusEffect(
    useCallback(() => {
      cargarCanales()
      cargarNoLeidos()
      listarServidores()
        .then((servidores) => setServer(servidores.find((s) => s.id === serverId) ?? null))
        .catch((err) => console.error('No se pudo cargar el servidor', err))
    }, [serverId, cargarCanales, cargarNoLeidos])
  )

  useEffect(() => {
    return suscribirseACanalesDeServidor(serverId, cargarCanales)
  }, [serverId, cargarCanales])

  const handleSelectChannel = useCallback(
    (channel: ChannelItem) => {
      if (channel.type === 'voice') {
        navigation.navigate('VoiceChannel', {
          channelId: channel.id,
          channelName: channel.name,
        })
      } else if (channel.type === 'forum') {
        navigation.navigate('ForumChannel', { serverId, channelId: channel.id, channelName: channel.name })
      } else {
        navigation.navigate('Channel', { serverId, channelId: channel.id, channelName: channel.name })
      }
    },
    [navigation, serverId]
  )

  const sections = useMemo(
    () =>
      categories
        .filter((category) => category.channels.length > 0)
        .map((category) => ({
          title: category.id === UNCATEGORIZED_ID ? '' : category.name,
          data: category.channels.map((channel) => ({
            ...channel,
            unread: unreadIds.has(channel.id),
            mentionCount: mentionsPorCanal.get(channel.id) ?? 0,
          })),
        })),
    [categories, unreadIds, mentionsPorCanal]
  )

  const renderItem = useCallback(
    ({ item }: { item: ChannelItem }) => (
      <View>
        <ChannelListItem channel={item} onPress={() => handleSelectChannel(item)} />
        {item.type === 'voice'
          ? (enVoz.get(item.id) ?? []).map((p) => (
              <View key={p.user.id} style={styles.participante}>
                <Avatar name={p.user.name} url={p.user.avatarUrl} size={22} />
                <Text style={styles.participanteNombre} numberOfLines={1}>
                  {p.user.name}
                </Text>
                {p.sharingScreen ? <Ionicons name="desktop-outline" size={13} color={colors.mutedForeground} /> : null}
                {p.cameraOn ? <Ionicons name="videocam-outline" size={13} color={colors.mutedForeground} /> : null}
                {p.deafened ? (
                  <Ionicons name="volume-mute" size={13} color={colors.destructive} />
                ) : p.muted ? (
                  <Ionicons name="mic-off" size={13} color={colors.destructive} />
                ) : null}
              </View>
            ))
          : null}
      </View>
    ),
    [handleSelectChannel, enVoz]
  )

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {server?.name ?? 'Servidor'}
        </Text>
        <Pressable onPress={() => navigation.navigate('ServerSettings', { serverId })} hitSlop={8}>
          <Ionicons name="settings-outline" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.subHeader}>
        <Pressable
          style={styles.subHeaderButton}
          onPress={() => navigation.navigate('ServerMembers', { serverId })}
        >
          <Ionicons name="people-outline" size={16} color={colors.mutedForeground} />
          <Text style={styles.subHeaderLabel}>Miembros</Text>
        </Pressable>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) =>
          section.title ? <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text> : null
        }
        renderItem={renderItem}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  participante: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.xl + spacing.lg,
    paddingRight: spacing.lg,
    paddingVertical: 3,
  },
  participanteNombre: { flex: 1, color: colors.mutedForeground, fontSize: fontSize.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  subHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  subHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  subHeaderLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
})
