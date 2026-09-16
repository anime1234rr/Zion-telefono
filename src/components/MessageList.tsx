import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native'

import { MessageGroupItem } from '@/components/MessageGroupItem'
import { EmptyState } from '@/components/EmptyState'
import { groupMessages } from '@/lib/message-grouping'
import { PerfProfiler } from '@/lib/internal/perf-metrics'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/theme'
import type { ChatMessage } from '@/lib/types'

function UnreadDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerLabel}>NUEVOS MENSAJES</Text>
      <View style={styles.dividerLine} />
    </View>
  )
}

export function MessageList({
  messages,
  onToggleReaction,
  onLongPressMessage,
  onPressAuthor,
  highlightMessageId,
  customEmojis,
  currentUserId,
  currentUsername,
  lastReadAt,
  onOpenImage,
}: {
  messages: ChatMessage[]
  onToggleReaction?: (messageId: string, emoji: string) => void
  onLongPressMessage?: (message: ChatMessage) => void
  onPressAuthor?: (userId: string) => void
  highlightMessageId?: string | null
  customEmojis?: Map<string, string>
  currentUserId?: string | null
  currentUsername?: string
  lastReadAt?: string | null
  onOpenImage?: (uri: string) => void
}) {
  const listRef = useRef<FlatList>(null)
  const groups = useMemo(() => groupMessages(messages), [messages])

  const [frozenLastRead, setFrozenLastRead] = useState<string | null | undefined>(lastReadAt)
  if (frozenLastRead === undefined && lastReadAt !== undefined) {
    setFrozenLastRead(lastReadAt)
  }

  const dividerGroupIndex = useMemo(() => {
    if (!frozenLastRead) return -1
    const cutoff = new Date(frozenLastRead).getTime()
    if (Number.isNaN(cutoff)) return -1
    for (let i = 0; i < groups.length; i++) {
      const hayNuevo = groups[i].items.some(
        (m) =>
          m.createdAt != null &&
          m.author.id !== currentUserId &&
          new Date(m.createdAt).getTime() > cutoff
      )
      if (hayNuevo) return i
    }
    return -1
  }, [groups, frozenLastRead, currentUserId])

  useEffect(() => {
    if (!highlightMessageId) return
    const index = groups.findIndex((group) =>
      group.items.some((message) => message.id === highlightMessageId)
    )
    if (index === -1) return
    const timeout = setTimeout(() => {
      listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 })
    }, 80)
    return () => clearTimeout(timeout)
  }, [highlightMessageId, groups])

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<(typeof groups)[number]>) => (
      <>
        {index === dividerGroupIndex ? <UnreadDivider /> : null}
        <MessageGroupItem
          group={item}
          onToggleReaction={onToggleReaction}
          onLongPressMessage={onLongPressMessage}
          onPressAuthor={onPressAuthor}
          highlightMessageId={highlightMessageId}
          customEmojis={customEmojis}
          currentUserId={currentUserId}
          currentUsername={currentUsername}
          onOpenImage={onOpenImage}
        />
      </>
    ),
    [
      dividerGroupIndex,
      onToggleReaction,
      onLongPressMessage,
      onPressAuthor,
      highlightMessageId,
      customEmojis,
      currentUserId,
      currentUsername,
      onOpenImage,
    ]
  )

  const keyExtractor = useCallback((group: (typeof groups)[number]) => group.items[0].id, [])

  const handleContentSizeChange = useCallback(() => {
    if (!highlightMessageId) listRef.current?.scrollToEnd({ animated: true })
  }, [highlightMessageId])

  const handleScrollToIndexFailed = useCallback((info: { averageItemLength: number; index: number }) => {
    setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: true,
      })
    }, 80)
  }, [])

  if (groups.length === 0) {
    return <EmptyState title="Todavía no hay mensajes" description="Sé el primero en escribir algo." />
  }

  return (
    <PerfProfiler id="MessageList">
      <FlatList
        ref={listRef}
        style={styles.list}
        data={groups}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onContentSizeChange={handleContentSizeChange}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        initialNumToRender={16}
        maxToRenderPerBatch={12}
        windowSize={9}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
      />
    </PerfProfiler>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.destructive,
    opacity: 0.6,
  },
  dividerLabel: {
    color: colors.destructive,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
