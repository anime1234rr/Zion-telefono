import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { ChannelListItem } from '@/components/ChannelListItem'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/hooks/use-auth'
import { useServerPermissions } from '@/hooks/use-server-permissions'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  listarCanales,
  reordenarCanales,
  suscribirseACanalesDeServidor,
  UNCATEGORIZED_ID,
  type ReordenCanal,
} from '@/lib/channels'
import { listarServidores } from '@/lib/servers'
import { listarCanalesNoLeidos } from '@/lib/read-state'
import { contarMencionesNoLeidas } from '@/lib/notifications'
import { getErrorMessage } from '@/lib/utils'
import {
  listarParticipantesDeVozDelServidor,
  suscribirseAEstadosVozGlobal,
  type VoiceParticipant,
} from '@/lib/voice'
import type { ChannelCategory, ChannelItem, ServerItem } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true)
}

type Props = NativeStackScreenProps<RootStackParamList, 'ServerChannels'>

type ChannelSlot =
  | { kind: 'channel'; channel: ChannelItem; categoryId: string }
  | { kind: 'placeholder'; categoryId: string }

const EMPTY_CATEGORY_DROP_HEIGHT = 32
const MOVE_THRESHOLD = 0.6

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

function draggableCategories(cats: ChannelCategory[]): ChannelCategory[] {
  return cats.filter((cat) => cat.id !== UNCATEGORIZED_ID)
}

function flattenChannels(cats: ChannelCategory[]): ChannelSlot[] {
  return cats.flatMap((cat): ChannelSlot[] =>
    cat.channels.length > 0
      ? cat.channels.map((channel) => ({ kind: 'channel', channel, categoryId: cat.id }))
      : [{ kind: 'placeholder', categoryId: cat.id }]
  )
}

function rebuildCategoriesFromFlat(cats: ChannelCategory[], flat: ChannelSlot[]): ChannelCategory[] {
  const byCategory = new Map<string, ChannelItem[]>()
  for (const cat of cats) byCategory.set(cat.id, [])
  for (const slot of flat) {
    if (slot.kind !== 'channel') continue
    byCategory.get(slot.categoryId)?.push(slot.channel)
  }
  return cats.map((cat) => ({ ...cat, channels: byCategory.get(cat.id) ?? [] }))
}

function GripHandle({
  size,
  canManage,
  onGrant,
  onMove,
  onRelease,
}: {
  size: number
  canManage: boolean
  onGrant: () => void
  onMove: (dy: number) => void
  onRelease: () => void
}) {
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => canManage,
    onMoveShouldSetPanResponder: () => canManage,
    onPanResponderGrant: () => onGrant(),
    onPanResponderMove: (_evt: GestureResponderEvent, gestureState: PanResponderGestureState) =>
      onMove(gestureState.dy),
    onPanResponderRelease: () => onRelease(),
    onPanResponderTerminate: () => onRelease(),
  })

  return (
    <View {...panResponder.panHandlers} hitSlop={10} style={styles.gripHandle}>
      <Ionicons name="reorder-three-outline" size={size} color={colors.mutedForeground} />
    </View>
  )
}

function CategoryBlock({
  category,
  canManage,
  isDragging,
  dragY,
  onLayout,
  onGrant,
  onMove,
  onRelease,
  children,
}: {
  category: ChannelCategory
  canManage: boolean
  isDragging: boolean
  dragY: Animated.Value
  onLayout: (height: number) => void
  onGrant: () => void
  onMove: (dy: number) => void
  onRelease: () => void
  children: React.ReactNode
}) {
  return (
    <Animated.View
      onLayout={(e) => onLayout(e.nativeEvent.layout.height)}
      style={isDragging ? [styles.draggingBlock, { transform: [{ translateY: dragY }] }] : undefined}
    >
      <View style={styles.categoryHeaderRow}>
        <Text style={styles.sectionTitle}>{category.name.toUpperCase()}</Text>
        {canManage ? (
          <GripHandle size={20} canManage={canManage} onGrant={onGrant} onMove={onMove} onRelease={onRelease} />
        ) : null}
      </View>
      {children}
    </Animated.View>
  )
}

function EmptyCategoryDropzone() {
  return (
    <View style={styles.emptyDropzone}>
      <Text style={styles.emptyDropzoneText}>Soltá un canal acá</Text>
    </View>
  )
}

function ChannelRowWrapper({
  channel,
  canManage,
  isDragging,
  dragY,
  onSelect,
  onLayout,
  onGrant,
  onMove,
  onRelease,
  footer,
}: {
  channel: ChannelItem
  canManage: boolean
  isDragging: boolean
  dragY: Animated.Value
  onSelect: () => void
  onLayout: (height: number) => void
  onGrant: () => void
  onMove: (dy: number) => void
  onRelease: () => void
  footer?: React.ReactNode
}) {
  return (
    <Animated.View
      onLayout={(e) => onLayout(e.nativeEvent.layout.height)}
      style={isDragging ? [styles.draggingBlock, { transform: [{ translateY: dragY }] }] : undefined}
    >
      <View style={styles.channelRowWithGrip}>
        <View style={styles.channelRowFlex}>
          <ChannelListItem channel={channel} onPress={onSelect} />
        </View>
        {canManage ? (
          <GripHandle size={18} canManage={canManage} onGrant={onGrant} onMove={onMove} onRelease={onRelease} />
        ) : null}
      </View>
      {footer}
    </Animated.View>
  )
}

export function ServerChannelsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const { user } = useAuth()
  const { hasPermission } = useServerPermissions(serverId, user?.id)
  const canManage = hasPermission('gestionar_canales')

  const [server, setServer] = useState<ServerItem | null>(null)
  const [categories, setCategories] = useState<ChannelCategory[]>([])
  const [localCategories, setLocalCategories] = useState<ChannelCategory[]>([])
  const [unreadIds, setUnreadIds] = useState<Set<string>>(new Set())
  const [mentionsPorCanal, setMentionsPorCanal] = useState<Map<string, number>>(new Map())
  const [enVoz, setEnVoz] = useState<Map<string, VoiceParticipant[]>>(new Map())

  const isDraggingRef = useRef(false)
  const dragSnapshotRef = useRef<ChannelCategory[] | null>(null)
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null)
  const [draggingChannelId, setDraggingChannelId] = useState<string | null>(null)
  const categoryDragY = useRef(new Animated.Value(0)).current
  const channelDragY = useRef(new Animated.Value(0)).current
  const categoryHeightsRef = useRef(new Map<string, number>())
  const channelHeightsRef = useRef(new Map<string, number>())
  const currentCategoryIndexRef = useRef(0)
  const lastAppliedCategoryDyRef = useRef(0)
  const currentChannelIndexRef = useRef(0)
  const lastAppliedChannelDyRef = useRef(0)

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

  useEffect(() => {
    if (isDraggingRef.current) return
    setLocalCategories(categories)
  }, [categories])

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

  async function persistCategoryOrder(cats: ChannelCategory[]) {
    const cambios: ReordenCanal[] = draggableCategories(cats).map((cat, index) => ({
      canalId: cat.id,
      categoriaId: null,
      posicion: index,
    }))
    try {
      await reordenarCanales(serverId, cambios)
      cargarCanales()
    } catch (err) {
      showAppAlert('No se pudo reordenar', getErrorMessage(err))
      if (dragSnapshotRef.current) setLocalCategories(dragSnapshotRef.current)
    } finally {
      dragSnapshotRef.current = null
    }
  }

  async function persistChannelOrder(cats: ChannelCategory[]) {
    const cambios: ReordenCanal[] = []
    cats.forEach((cat) => {
      const categoriaId = cat.id === UNCATEGORIZED_ID ? null : cat.id
      cat.channels.forEach((channel, index) => {
        cambios.push({ canalId: channel.id, categoriaId, posicion: index })
      })
    })
    try {
      await reordenarCanales(serverId, cambios)
      cargarCanales()
    } catch (err) {
      showAppAlert('No se pudo reordenar', getErrorMessage(err))
      if (dragSnapshotRef.current) setLocalCategories(dragSnapshotRef.current)
    } finally {
      dragSnapshotRef.current = null
    }
  }

  function handleCategoryDragGrant(categoryId: string) {
    dragSnapshotRef.current = localCategories
    isDraggingRef.current = true
    setDraggingCategoryId(categoryId)
    categoryDragY.setValue(0)
    currentCategoryIndexRef.current = draggableCategories(localCategories).findIndex((c) => c.id === categoryId)
    lastAppliedCategoryDyRef.current = 0
  }

  function handleCategoryDragMove(dy: number) {
    categoryDragY.setValue(dy)
    let delta = dy - lastAppliedCategoryDyRef.current
    const uncategorized = localCategories.find((c) => c.id === UNCATEGORIZED_ID) ?? null
    const draggable = draggableCategories(localCategories)
    let idx = currentCategoryIndexRef.current
    let changed = false

    while (delta > 0 && idx < draggable.length - 1) {
      const nextHeight = categoryHeightsRef.current.get(draggable[idx + 1].id) ?? 0
      if (nextHeight === 0 || delta <= nextHeight * MOVE_THRESHOLD) break
      delta -= nextHeight
      lastAppliedCategoryDyRef.current += nextHeight
      idx += 1
      changed = true
    }
    while (delta < 0 && idx > 0) {
      const prevHeight = categoryHeightsRef.current.get(draggable[idx - 1].id) ?? 0
      if (prevHeight === 0 || -delta <= prevHeight * MOVE_THRESHOLD) break
      delta += prevHeight
      lastAppliedCategoryDyRef.current -= prevHeight
      idx -= 1
      changed = true
    }

    if (!changed) return
    const moved = arrayMove(draggable, currentCategoryIndexRef.current, idx)
    currentCategoryIndexRef.current = idx
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setLocalCategories(uncategorized ? [uncategorized, ...moved] : moved)
  }

  function handleCategoryDragRelease() {
    isDraggingRef.current = false
    setDraggingCategoryId(null)
    categoryDragY.setValue(0)
    persistCategoryOrder(localCategories)
  }

  function slotHeight(slot: ChannelSlot): number {
    if (slot.kind === 'placeholder') return EMPTY_CATEGORY_DROP_HEIGHT
    return channelHeightsRef.current.get(slot.channel.id) ?? 0
  }

  function handleChannelDragGrant(channelId: string) {
    dragSnapshotRef.current = localCategories
    isDraggingRef.current = true
    setDraggingChannelId(channelId)
    channelDragY.setValue(0)
    const flat = flattenChannels(localCategories)
    currentChannelIndexRef.current = flat.findIndex(
      (slot) => slot.kind === 'channel' && slot.channel.id === channelId
    )
    lastAppliedChannelDyRef.current = 0
  }

  function handleChannelDragMove(dy: number) {
    channelDragY.setValue(dy)
    let delta = dy - lastAppliedChannelDyRef.current
    const flat = flattenChannels(localCategories)
    const anchoredIdx = flat.findIndex(
      (slot) => slot.kind === 'channel' && slot.channel.id === draggingChannelId
    )
    const startIdx = anchoredIdx === -1 ? currentChannelIndexRef.current : anchoredIdx
    let idx = startIdx
    let changed = false

    while (delta > 0 && idx < flat.length - 1) {
      const nextHeight = slotHeight(flat[idx + 1])
      if (nextHeight === 0 || delta <= nextHeight * MOVE_THRESHOLD) break
      delta -= nextHeight
      lastAppliedChannelDyRef.current += nextHeight
      idx += 1
      changed = true
    }
    while (delta < 0 && idx > 0) {
      const prevHeight = slotHeight(flat[idx - 1])
      if (prevHeight === 0 || -delta <= prevHeight * MOVE_THRESHOLD) break
      delta += prevHeight
      lastAppliedChannelDyRef.current -= prevHeight
      idx -= 1
      changed = true
    }

    if (!changed) return
    const draggedSlot = flat[startIdx]
    if (draggedSlot.kind !== 'channel') return
    const targetCategoryId = flat[idx].categoryId
    const nextFlat = arrayMove(flat, startIdx, idx)
    nextFlat[idx] = { kind: 'channel', channel: draggedSlot.channel, categoryId: targetCategoryId }
    currentChannelIndexRef.current = idx
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setLocalCategories(rebuildCategoriesFromFlat(localCategories, nextFlat))
  }

  function handleChannelDragRelease() {
    isDraggingRef.current = false
    setDraggingChannelId(null)
    channelDragY.setValue(0)
    persistChannelOrder(localCategories)
  }

  const decoratedCategories = useMemo(
    () =>
      localCategories.map((cat) => ({
        ...cat,
        channels: cat.channels.map((ch) => ({
          ...ch,
          unread: unreadIds.has(ch.id),
          mentionCount: mentionsPorCanal.get(ch.id) ?? 0,
        })),
      })),
    [localCategories, unreadIds, mentionsPorCanal]
  )

  const visibleCategories = useMemo(
    () => decoratedCategories.filter((cat) => canManage || cat.channels.length > 0),
    [decoratedCategories, canManage]
  )

  const uncategorized = visibleCategories.find((cat) => cat.id === UNCATEGORIZED_ID) ?? null
  const namedCategories = visibleCategories.filter((cat) => cat.id !== UNCATEGORIZED_ID)

  function renderChannelRow(channel: ChannelItem) {
    const participants = channel.type === 'voice' ? enVoz.get(channel.id) : undefined
    return (
      <ChannelRowWrapper
        key={channel.id}
        channel={channel}
        canManage={canManage}
        isDragging={draggingChannelId === channel.id}
        dragY={channelDragY}
        onSelect={() => handleSelectChannel(channel)}
        onLayout={(height) => channelHeightsRef.current.set(channel.id, height)}
        onGrant={() => handleChannelDragGrant(channel.id)}
        onMove={(dy) => handleChannelDragMove(dy)}
        onRelease={() => handleChannelDragRelease()}
        footer={
          participants && participants.length > 0 ? (
            <View>
              {participants.map((p) => (
                <View key={p.user.id} style={styles.participante}>
                  <Avatar name={p.user.name} url={p.user.avatarUrl} size={22} />
                  <Text style={styles.participanteNombre} numberOfLines={1}>
                    {p.user.name}
                  </Text>
                  {p.sharingScreen ? (
                    <Ionicons name="desktop-outline" size={13} color={colors.mutedForeground} />
                  ) : null}
                  {p.cameraOn ? (
                    <Ionicons name="videocam-outline" size={13} color={colors.mutedForeground} />
                  ) : null}
                  {p.deafened ? (
                    <Ionicons name="volume-mute" size={13} color={colors.destructive} />
                  ) : p.muted ? (
                    <Ionicons name="mic-off" size={13} color={colors.destructive} />
                  ) : null}
                </View>
              ))}
            </View>
          ) : undefined
        }
      />
    )
  }

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {uncategorized ? (
          <View onLayout={(e) => categoryHeightsRef.current.set(uncategorized.id, e.nativeEvent.layout.height)}>
            {uncategorized.channels.length > 0
              ? uncategorized.channels.map((channel) => renderChannelRow(channel))
              : canManage
                ? <EmptyCategoryDropzone />
                : null}
          </View>
        ) : null}

        {namedCategories.map((category) => (
          <CategoryBlock
            key={category.id}
            category={category}
            canManage={canManage}
            isDragging={draggingCategoryId === category.id}
            dragY={categoryDragY}
            onLayout={(height) => categoryHeightsRef.current.set(category.id, height)}
            onGrant={() => handleCategoryDragGrant(category.id)}
            onMove={(dy) => handleCategoryDragMove(dy)}
            onRelease={() => handleCategoryDragRelease()}
          >
            {category.channels.length > 0 ? (
              category.channels.map((channel) => renderChannelRow(channel))
            ) : (
              <EmptyCategoryDropzone />
            )}
          </CategoryBlock>
        ))}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: spacing.lg,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  gripHandle: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  channelRowWithGrip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelRowFlex: {
    flex: 1,
    minWidth: 0,
  },
  draggingBlock: {
    zIndex: 10,
    elevation: 6,
    opacity: 0.92,
    backgroundColor: colors.card,
  },
  emptyDropzone: {
    height: EMPTY_CATEGORY_DROP_HEIGHT,
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDropzoneText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
})
