import { useEffect, useState } from 'react'
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import { Avatar } from '@/components/Avatar'
import { buscarMensajes, type MessageSearchResult, type SearchScope } from '@/lib/search'
import { getErrorMessage } from '@/lib/utils'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MessageSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      setQuery('')
      setResults([])
      setError(null)
      setScope('channel')
    }
  }, [visible])

  useEffect(() => {
    if (!visible) return
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timeout = setTimeout(() => {
      buscarMensajes(serverId, { type: scope, canalId: channelId }, { query })
        .then((data) => {
          setResults(data)
          setError(null)
        })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [visible, query, scope, serverId, channelId])

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
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar mensajes"
            placeholderTextColor={colors.mutedForeground}
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            autoFocus
          />
        </View>

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

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !loading && query.trim() ? <Text style={styles.info}>Sin resultados.</Text> : null
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
  info: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: spacing.xl,
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
