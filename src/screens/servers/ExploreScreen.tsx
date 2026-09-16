import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { showAppAlert } from '@/hooks/use-app-alert'
import { explorarComunidades, type CommunityListing } from '@/lib/explore'
import { unirseAServidor } from '@/lib/servers'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const CATEGORIAS: { id: string; label: string; palabras: string[] }[] = [
  { id: 'todos', label: 'Todos', palabras: [] },
  { id: 'anime', label: 'Anime', palabras: ['anime', 'manga', 'otaku', 'waifu', 'weeb', 'cosplay'] },
  {
    id: 'gaming',
    label: 'Gaming',
    palabras: ['gaming', 'gamer', 'juego', 'videojuego', 'game', 'esport', 'fps', 'rpg', 'minecraft', 'valorant', 'league', 'fortnite', 'roblox', 'steam'],
  },
  {
    id: 'tecnologia',
    label: 'Tecnología',
    palabras: ['tech', 'tecnolog', 'program', 'desarroll', 'codigo', 'code', 'software', 'hardware', 'linux', 'javascript', 'python', 'inteligencia artificial', 'devops'],
  },
  {
    id: 'musica',
    label: 'Música',
    palabras: ['music', 'musica', 'beat', 'productor', 'rap', 'rock', 'pop', 'trap', 'dj', 'banda'],
  },
  { id: 'arte', label: 'Arte', palabras: ['arte', 'art', 'dibujo', 'draw', 'ilustra', 'diseno', 'design', 'pixel', 'nft'] },
  { id: 'social', label: 'Social', palabras: ['comunidad', 'amigos', 'chat', 'social', 'hangout', 'charla', 'conocer'] },
]

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
}

function coincideCategoria(comunidad: CommunityListing, categoriaId: string): boolean {
  const cat = CATEGORIAS.find((c) => c.id === categoriaId)
  if (!cat || cat.palabras.length === 0) return true
  const heno = normalizar(`${comunidad.name} ${comunidad.description ?? ''}`)
  return cat.palabras.some((palabra) => heno.includes(normalizar(palabra)))
}

function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatearMiembros(total: number): string {
  if (total >= 1000) return `${(total / 1000).toFixed(total >= 10000 ? 0 : 1)} k`
  return String(total)
}

function CommunityCard({
  community,
  joining,
  onAction,
}: {
  community: CommunityListing
  joining: boolean
  onAction: () => void
}) {
  return (
    <View style={styles.card}>
      <View style={styles.banner}>
        {community.bannerUrl ? (
          <Image source={{ uri: community.bannerUrl }} style={styles.bannerImg} contentFit="cover" />
        ) : community.iconUrl ? (
          <Image source={{ uri: community.iconUrl }} style={styles.bannerBlur} contentFit="cover" blurRadius={20} />
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            {community.iconUrl ? (
              <Image source={{ uri: community.iconUrl }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <Text style={styles.avatarLabel}>{iniciales(community.name)}</Text>
            )}
          </View>
          <View style={styles.memberPill}>
            <Ionicons name="people-outline" size={13} color={colors.mutedForeground} />
            <Text style={styles.memberPillText}>{formatearMiembros(community.memberCount)}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {community.name}
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {community.description?.trim() || 'Esta comunidad todavía no tiene descripción.'}
        </Text>

        <Pressable
          style={[styles.joinBtn, community.isMember && styles.joinBtnMember]}
          disabled={joining}
          onPress={onAction}
        >
          {joining ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : community.isMember ? (
            <>
              <Ionicons name="checkmark" size={16} color={colors.foreground} />
              <Text style={styles.joinBtnMemberText}>Ya eres miembro</Text>
            </>
          ) : (
            <Text style={styles.joinBtnText}>Unirme</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

export function ExploreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [query, setQuery] = useState('')
  const [categoria, setCategoria] = useState('todos')
  const [comunidades, setComunidades] = useState<CommunityListing[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [uniendo, setUniendo] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    const t = setTimeout(() => {
      setCargando(true)
      setError(false)
      explorarComunidades(query)
        .then((data) => {
          if (!cancelado) setComunidades(data)
        })
        .catch(() => {
          if (!cancelado) setError(true)
        })
        .finally(() => {
          if (!cancelado) setCargando(false)
        })
    }, 250)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [query])

  const visibles = useMemo(
    () => comunidades.filter((c) => coincideCategoria(c, categoria)),
    [comunidades, categoria]
  )
  const hayFiltros = query.trim() !== '' || categoria !== 'todos'

  async function handleAccion(comunidad: CommunityListing) {
    if (comunidad.isMember) {
      navigation.navigate('ServerChannels', { serverId: comunidad.id })
      return
    }
    if (!comunidad.inviteCode) {
      showAppAlert('Esta comunidad no acepta nuevos miembros ahora mismo')
      return
    }
    setUniendo(comunidad.id)
    try {
      const servidor = await unirseAServidor(comunidad.inviteCode)
      setComunidades((prev) =>
        prev.map((c) =>
          c.id === comunidad.id ? { ...c, isMember: true, memberCount: c.memberCount + 1 } : c
        )
      )
      navigation.navigate('ServerChannels', { serverId: servidor.id })
    } catch (err) {
      showAppAlert('No se pudo unir', err instanceof Error ? err.message : undefined)
    } finally {
      setUniendo(null)
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={20} color={colors.primary} />
        <Text style={styles.headerTitle}>Explorar comunidades</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o tema"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORIAS.map((cat) => (
          <Pressable
            key={cat.id}
            style={[styles.chip, categoria === cat.id && styles.chipActive]}
            onPress={() => setCategoria(cat.id)}
          >
            <Text style={[styles.chipText, categoria === cat.id && styles.chipTextActive]}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {cargando ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="compass-outline" size={28} color={colors.mutedForeground} />
          <Text style={styles.emptyText}>No se pudieron cargar las comunidades.</Text>
        </View>
      ) : visibles.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <Ionicons name="telescope-outline" size={30} color={colors.mutedForeground} />
          </View>
          <Text style={styles.emptyTitle}>
            {hayFiltros ? 'Nada por acá todavía' : 'Todavía no hay comunidades públicas'}
          </Text>
          <Text style={styles.emptyText}>
            {hayFiltros
              ? 'Probá con otro tema o mirá otras categorías.'
              : 'Cuando alguien active la comunidad de su servidor, va a aparecer acá.'}
          </Text>
          {hayFiltros ? (
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                setQuery('')
                setCategoria('todos')
              }}
            >
              <Text style={styles.clearBtnText}>Limpiar filtros</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <CommunityCard
              community={item}
              joining={uniendo === item.id}
              onAction={() => handleAccion(item)}
            />
          )}
        />
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.foreground,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.md,
    padding: 0,
  },
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    gap: spacing.xs,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chip: {
    alignSelf: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  chipText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.foreground,
  },
  list: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  banner: {
    height: 88,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerBlur: {
    width: '100%',
    height: '100%',
    opacity: 0.35,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: -40,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 4,
    borderColor: colors.card,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLabel: {
    color: colors.foreground,
    fontWeight: '700',
    fontSize: fontSize.md,
  },
  memberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.muted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  memberPillText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  cardTitle: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  cardDesc: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 18,
    minHeight: 36,
  },
  joinBtn: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  joinBtnMember: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  joinBtnText: {
    color: colors.primaryForeground,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  joinBtnMemberText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  clearBtn: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  clearBtnText: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
})
