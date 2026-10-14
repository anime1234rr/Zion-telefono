import { useEffect, useRef, useState } from 'react'
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
import { PersonasExplorar } from '@/components/PersonasExplorar'
import { showAppAlert } from '@/hooks/use-app-alert'
import {
  explorarComunidades,
  explorarComunidadesDestacadas,
  listarEtiquetasPopulares,
  type CommunityListing,
  type EtiquetaPopular,
  type PeriodoDestacado,
} from '@/lib/explore'
import { unirseAServidor } from '@/lib/servers'
import { suscribirseAExplorar } from '@/lib/realtime-avisos'
import type { RootStackParamList } from '@/navigation/types'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const PERIODOS: { value: PeriodoDestacado; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mensual' },
  { value: 'anio', label: 'Anual' },
]

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

        <View style={styles.titleRow}>
          <Text style={[styles.cardTitle, styles.titleText]} numberOfLines={1}>
            {community.name}
          </Text>
          {community.featured ? (
            <View style={styles.featured}>
              <Ionicons name="sparkles" size={11} color={colors.primary} />
              <Text style={styles.featuredText}>Destacado</Text>
            </View>
          ) : null}
        </View>
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
  const [modo, setModo] = useState<'servidores' | 'personas'>('servidores')
  const [query, setQuery] = useState('')
  const [queryPersonas, setQueryPersonas] = useState('')
  const [etiquetaSeleccionada, setEtiquetaSeleccionada] = useState<string | null>(null)
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<EtiquetaPopular[]>([])
  const [comunidades, setComunidades] = useState<CommunityListing[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [uniendo, setUniendo] = useState<string | null>(null)
  const [periodoDestacado, setPeriodoDestacado] = useState<PeriodoDestacado>('dia')
  const [destacados, setDestacados] = useState<CommunityListing[]>([])
  const queryRef = useRef(query)
  const etiquetaRef = useRef(etiquetaSeleccionada)

  useEffect(() => {
    queryRef.current = query
  }, [query])

  useEffect(() => {
    etiquetaRef.current = etiquetaSeleccionada
  }, [etiquetaSeleccionada])

  useEffect(() => {
    listarEtiquetasPopulares(20)
      .then(setEtiquetasDisponibles)
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelado = false
    explorarComunidadesDestacadas(periodoDestacado, 10)
      .then((data) => {
        if (!cancelado) setDestacados(data)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [periodoDestacado])

  useEffect(
    () =>
      suscribirseAExplorar(() => {
        explorarComunidades(queryRef.current, { etiqueta: etiquetaRef.current })
          .then(setComunidades)
          .catch(() => {})
      }),
    []
  )

  useEffect(() => {
    let cancelado = false
    const t = setTimeout(() => {
      setCargando(true)
      setError(false)
      explorarComunidades(query, { etiqueta: etiquetaSeleccionada })
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
  }, [query, etiquetaSeleccionada])

  const visibles = comunidades
  const hayFiltros = query.trim() !== '' || etiquetaSeleccionada !== null

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
        <Text style={styles.headerTitle}>Explorar</Text>
      </View>

      <View style={styles.modeTabs}>
        {(
          [
            ['servidores', 'Servidores', 'server-outline'],
            ['personas', 'Personas', 'people-outline'],
          ] as const
        ).map(([valor, label, icon]) => (
          <Pressable
            key={valor}
            style={[styles.modeTab, modo === valor && styles.modeTabActive]}
            onPress={() => setModo(valor)}
          >
            <Ionicons
              name={icon}
              size={15}
              color={modo === valor ? colors.foreground : colors.mutedForeground}
            />
            <Text style={[styles.modeTabText, modo === valor && styles.modeTabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder={modo === 'servidores' ? 'Buscar por nombre o tema' : 'Buscar personas por nombre'}
          placeholderTextColor={colors.mutedForeground}
          value={modo === 'servidores' ? query : queryPersonas}
          onChangeText={modo === 'servidores' ? setQuery : setQueryPersonas}
        />
      </View>

      {modo === 'personas' ? (
        <PersonasExplorar query={queryPersonas} />
      ) : (
        <>
          <View style={styles.destacadoHeader}>
            <Ionicons name="trending-up-outline" size={14} color={colors.primary} />
            <Text style={styles.destacadoTitle}>Destacado</Text>
          </View>
          <View style={styles.periodoRow}>
            {PERIODOS.map((p) => (
              <Pressable
                key={p.value}
                style={[styles.periodoChip, periodoDestacado === p.value && styles.chipActive]}
                onPress={() => setPeriodoDestacado(p.value)}
              >
                <Text style={[styles.chipText, periodoDestacado === p.value && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {destacados.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={destacados}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.destacadoList}
              renderItem={({ item }) => (
                <View style={styles.destacadoCardWrap}>
                  <CommunityCard
                    community={item}
                    joining={uniendo === item.id}
                    onAction={() => handleAccion(item)}
                  />
                </View>
              )}
            />
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            <Pressable
              style={[styles.chip, etiquetaSeleccionada === null && styles.chipActive]}
              onPress={() => setEtiquetaSeleccionada(null)}
            >
              <Text style={[styles.chipText, etiquetaSeleccionada === null && styles.chipTextActive]}>
                Todos
              </Text>
            </Pressable>
            {etiquetasDisponibles.map((et) => (
              <Pressable
                key={et.id}
                style={[styles.chip, etiquetaSeleccionada === et.nombre && styles.chipActive]}
                onPress={() => setEtiquetaSeleccionada(et.nombre)}
              >
                <Text
                  style={[styles.chipText, etiquetaSeleccionada === et.nombre && styles.chipTextActive]}
                >
                  {et.nombre}
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
                    setEtiquetaSeleccionada(null)
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
        </>
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  modeTabs: {
    flexDirection: 'row',
    gap: 4,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  modeTabActive: { backgroundColor: colors.background },
  modeTabText: { color: colors.mutedForeground, fontSize: fontSize.sm, fontWeight: '600' },
  modeTabTextActive: { color: colors.foreground },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  titleText: { flexShrink: 1 },
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: alfa(colors.primary, 0.15),
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  featuredText: { color: colors.primary, fontSize: 10, fontWeight: '700' },
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
  destacadoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  destacadoTitle: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  periodoRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  periodoChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  destacadoList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  destacadoCardWrap: {
    width: 220,
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
    backgroundColor: alfa(colors.primary, 0.12),
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
    backgroundColor: alfa(colors.primary, 0.18),
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
