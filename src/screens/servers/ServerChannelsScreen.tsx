import { useCallback, useEffect, useState } from 'react'
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { ChannelListItem } from '@/components/ChannelListItem'
import { listarCanales, suscribirseACanalesDeServidor, UNCATEGORIZED_ID } from '@/lib/channels'
import { listarServidores } from '@/lib/servers'
import type { ChannelCategory, ChannelItem, ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerChannels'>

export function ServerChannelsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [categories, setCategories] = useState<ChannelCategory[]>([])

  const cargarCanales = useCallback(() => {
    listarCanales(serverId)
      .then(setCategories)
      .catch((err) => console.error('No se pudieron cargar los canales', err))
  }, [serverId])

  useFocusEffect(
    useCallback(() => {
      cargarCanales()
      listarServidores()
        .then((servidores) => setServer(servidores.find((s) => s.id === serverId) ?? null))
        .catch((err) => console.error('No se pudo cargar el servidor', err))
    }, [serverId, cargarCanales])
  )

  useEffect(() => {
    return suscribirseACanalesDeServidor(serverId, cargarCanales)
  }, [serverId, cargarCanales])

  function handleSelectChannel(channel: ChannelItem) {
    if (channel.type === 'voice') {
      navigation.navigate('VoiceChannelPlaceholder', { channelId: channel.id, channelName: channel.name })
    } else {
      navigation.navigate('Channel', { serverId, channelId: channel.id, channelName: channel.name })
    }
  }

  const sections = categories
    .filter((category) => category.channels.length > 0)
    .map((category) => ({
      title: category.id === UNCATEGORIZED_ID ? '' : category.name,
      data: category.channels,
    }))

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
        renderItem={({ item }) => (
          <ChannelListItem channel={item} onPress={() => handleSelectChannel(item)} />
        )}
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
