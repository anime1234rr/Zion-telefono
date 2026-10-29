import { useEffect, useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import {
  buscarMensajes,
  buscarUsuariosEnServidor,
  type MessageSearchResult,
  type SearchScope,
} from '@/lib/search'
import { listarCanales } from '@/lib/channels'
import { getErrorMessage } from '@/lib/utils'
import type { ChannelItem, ChatAttachment, ChatUser } from '@/lib/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const TIENE_RE = /\btiene:(imagen|imágen|foto|video|audio)\b/i
const DE_RE = /\bde:@?(\S+)/i
const EN_RE = /\ben:#?(\S+)/i
const DURANTE_RE = /\bdurante:(\S+)/i

const tieneLabelToType: Record<string, ChatAttachment['type']> = {
  imagen: 'image',
  imágen: 'image',
  foto: 'image',
  video: 'video',
  audio: 'audio',
}

const adjuntoLabel: Record<ChatAttachment['type'], string> = {
  image: 'Imagen',
  video: 'Video',
  audio: 'Audio',
}

const duranteLabels: Record<string, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: 'Última semana',
  mes: 'Último mes',
}

function rangoPorPalabraClave(palabra: string): { desde: Date; hasta: Date | null } | null {
  const clave = palabra.toLowerCase()
  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

  if (clave === 'hoy') return { desde: inicioHoy, hasta: null }
  if (clave === 'ayer') {
    const inicioAyer = new Date(inicioHoy)
    inicioAyer.setDate(inicioAyer.getDate() - 1)
    return { desde: inicioAyer, hasta: inicioHoy }
  }
  if (clave === 'semana') return { desde: new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000), hasta: null }
  if (clave === 'mes') return { desde: new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000), hasta: null }
  return null
}

function previewDeResultado(result: MessageSearchResult): string {
  if (result.esCodigo) return 'Código'
  if (result.contenido) return result.contenido
  if (result.attachment) return 'Adjunto'
  return ''
}

export function SearchModal({
  visible,
  onClose,
  serverId,
  channelId,
  onJumpToMessage,
}: {
  visible: boolean
  onClose: () => void
  serverId: string
  channelId: string
  onJumpToMessage: (channelId: string, messageId: string, channelName: string) => void
}) {
  const [scope, setScope] = useState<SearchScope>('channel')
  const [rawQuery, setRawQuery] = useState('')
  const [authorFilter, setAuthorFilter] = useState<ChatUser | null>(null)
  const [adjuntoFilter, setAdjuntoFilter] = useState<ChatAttachment['type'] | null>(null)
  const [channelFilter, setChannelFilter] = useState<ChannelItem | null>(null)
  const [duranteFilter, setDuranteFilter] = useState<string | null>(null)
  const [authorSuggestions, setAuthorSuggestions] = useState<ChatUser[]>([])
  const [channels, setChannels] = useState<ChannelItem[]>([])
  const [results, setResults] = useState<MessageSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const freeText = useMemo(() => rawQuery.replace(/\s+/g, ' ').trim(), [rawQuery])
  const hasCriteria = Boolean(freeText || authorFilter || adjuntoFilter || channelFilter || duranteFilter)

  useEffect(() => {
    if (!visible) {
      setRawQuery('')
      setAuthorFilter(null)
      setAdjuntoFilter(null)
      setChannelFilter(null)
      setDuranteFilter(null)
      setAuthorSuggestions([])
      setResults([])
      setError(null)
      setScope('channel')
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    let cancelado = false
    listarCanales(serverId)
      .then((categorias) => {
        if (!cancelado) setChannels(categorias.flatMap((c) => c.channels))
      })
      .catch(() => !cancelado && setChannels([]))
    return () => {
      cancelado = true
    }
  }, [visible, serverId])

  useEffect(() => {
    const deMatch = freeText.match(DE_RE)
    if (!deMatch || authorFilter) return
    let cancelado = false
    const timeout = setTimeout(() => {
      buscarUsuariosEnServidor(serverId, deMatch[1])
        .then((lista) => !cancelado && setAuthorSuggestions(lista))
        .catch(() => !cancelado && setAuthorSuggestions([]))
    }, 200)
    return () => {
      cancelado = true
      clearTimeout(timeout)
    }
  }, [freeText, authorFilter, serverId])

  function handleQueryChange(value: string) {
    const tieneMatch = value.match(TIENE_RE)
    if (tieneMatch) {
      const type = tieneLabelToType[tieneMatch[1].toLowerCase()]
      if (type) setAdjuntoFilter(type)
      value = (
        value.slice(0, tieneMatch.index) + value.slice(tieneMatch.index! + tieneMatch[0].length)
      ).replace(/\s+/g, ' ')
    }

    const duranteMatch = value.match(DURANTE_RE)
    if (duranteMatch && rangoPorPalabraClave(duranteMatch[1])) {
      setDuranteFilter(duranteMatch[1].toLowerCase())
      value = (
        value.slice(0, duranteMatch.index) + value.slice(duranteMatch.index! + duranteMatch[0].length)
      ).replace(/\s+/g, ' ')
    }

    const enMatch = value.match(EN_RE)
    if (enMatch) {
      const buscado = enMatch[1].toLowerCase()
      const encontrado =
        channels.find((c) => c.name.toLowerCase() === buscado) ??
        channels.find((c) => c.name.toLowerCase().startsWith(buscado))
      if (encontrado) {
        setChannelFilter(encontrado)
        value = (
          value.slice(0, enMatch.index) + value.slice(enMatch.index! + enMatch[0].length)
        ).replace(/\s+/g, ' ')
      }
    }

    setRawQuery(value)
  }

  function pickAuthorSuggestion(user: ChatUser) {
    setAuthorFilter(user)
    setAuthorSuggestions([])
    setRawQuery((prev) => prev.replace(DE_RE, ' ').replace(/\s+/g, ' ').trim())
  }

  useEffect(() => {
    if (!visible) return
    const rango = duranteFilter ? rangoPorPalabraClave(duranteFilter) : null
    if (!freeText && !authorFilter && !adjuntoFilter && !channelFilter && !rango) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      buscarMensajes(
        serverId,
        { type: scope, canalId: channelId },
        {
          query: freeText,
          autorId: authorFilter?.id ?? null,
          adjuntoTipo: adjuntoFilter,
          canalIdOverride: channelFilter?.id ?? null,
          desde: rango?.desde ?? null,
          hasta: rango?.hasta ?? null,
        }
      )
        .then((data) => {
          setResults(data)
          setError(null)
        })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [visible, freeText, authorFilter, adjuntoFilter, channelFilter, duranteFilter, scope, serverId, channelId])

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.title}>Buscar</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.input}
            value={rawQuery}
            onChangeText={handleQueryChange}
            placeholder="Buscar mensajes… probá de:usuario, en:canal"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            autoFocus
          />
        </View>

        {authorSuggestions.length > 0 && !authorFilter ? (
          <View style={styles.suggestionBox}>
            {authorSuggestions.map((user) => (
              <Pressable key={user.id} style={styles.suggestionRow} onPress={() => pickAuthorSuggestion(user)}>
                <Avatar name={user.name} url={user.avatarUrl} size={28} />
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {user.name}
                </Text>
                <Text style={styles.suggestionHint}>Filtrar por autor</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.scopeRow}>
          <Pressable
            style={[styles.scopeChip, scope === 'channel' && styles.scopeChipActive]}
            onPress={() => setScope('channel')}
          >
            <Text style={[styles.scopeLabel, scope === 'channel' && styles.scopeLabelActive]}>
              Este canal
            </Text>
          </Pressable>
          <Pressable
            style={[styles.scopeChip, scope === 'server' && styles.scopeChipActive]}
            onPress={() => setScope('server')}
          >
            <Text style={[styles.scopeLabel, scope === 'server' && styles.scopeLabelActive]}>
              Todo el servidor
            </Text>
          </Pressable>
        </View>

        {(authorFilter || adjuntoFilter || channelFilter || duranteFilter) && (
          <View style={styles.filterChipsRow}>
            {authorFilter ? (
              <Pressable style={styles.filterChip} onPress={() => setAuthorFilter(null)}>
                <Text style={styles.filterChipText}>de: {authorFilter.name}</Text>
                <Ionicons name="close" size={12} color={colors.primary} />
              </Pressable>
            ) : null}
            {adjuntoFilter ? (
              <Pressable style={styles.filterChip} onPress={() => setAdjuntoFilter(null)}>
                <Text style={styles.filterChipText}>{adjuntoLabel[adjuntoFilter]}</Text>
                <Ionicons name="close" size={12} color={colors.primary} />
              </Pressable>
            ) : null}
            {channelFilter ? (
              <Pressable style={styles.filterChip} onPress={() => setChannelFilter(null)}>
                <Text style={styles.filterChipText}>en: #{channelFilter.name}</Text>
                <Ionicons name="close" size={12} color={colors.primary} />
              </Pressable>
            ) : null}
            {duranteFilter ? (
              <Pressable style={styles.filterChip} onPress={() => setDuranteFilter(null)}>
                <Text style={styles.filterChipText}>{duranteLabels[duranteFilter] ?? duranteFilter}</Text>
                <Ionicons name="close" size={12} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!hasCriteria ? (
          <Text style={styles.hint}>
            Usá de:usuario, en:canal, tiene:imagen/video/audio, o durante:hoy/ayer/semana/mes.
          </Text>
        ) : null}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loading && hasCriteria ? <Text style={styles.info}>Sin resultados.</Text> : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onJumpToMessage(item.canalId, item.id, item.canalNombre)
                onClose()
              }}
            >
              <Avatar name={item.author.name} url={item.author.avatarUrl} size={36} />
              <View style={styles.rowBody}>
                <View style={styles.rowHeader}>
                  <Text style={styles.author} numberOfLines={1}>
                    {item.author.name}
                  </Text>
                  <Text style={styles.channelName} numberOfLines={1}>
                    #{item.canalNombre}
                  </Text>
                </View>
                <Text style={styles.preview} numberOfLines={2}>
                  {previewDeResultado(item)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </ScreenContainer>
    </Modal>
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
  },
  searchWrapper: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  input: {
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  suggestionBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionName: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  suggestionHint: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scopeChip: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  scopeChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  scopeLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  scopeLabelActive: {
    color: colors.primaryForeground,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  filterChipText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  info: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  hint: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  error: {
    color: colors.destructive,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  author: {
    color: colors.foreground,
    fontSize: fontSize.sm,
    fontWeight: '600',
    flexShrink: 1,
  },
  channelName: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    flexShrink: 1,
  },
  preview: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
  },
})
