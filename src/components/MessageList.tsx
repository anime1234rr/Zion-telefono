import { useEffect, useMemo, useRef } from 'react'
import { FlatList, StyleSheet } from 'react-native'

import { MessageGroupItem } from '@/components/MessageGroupItem'
import { EmptyState } from '@/components/EmptyState'
import { groupMessages } from '@/lib/message-grouping'
import type { ChatMessage } from '@/lib/types'

export function MessageList({
  messages,
  onToggleReaction,
  onLongPressMessage,
  onPressAuthor,
  highlightMessageId,
  customEmojis,
}: {
  messages: ChatMessage[]
  onToggleReaction?: (messageId: string, emoji: string) => void
  onLongPressMessage?: (message: ChatMessage) => void
  onPressAuthor?: (userId: string) => void
  highlightMessageId?: string | null
  customEmojis?: Map<string, string>
}) {
  const listRef = useRef<FlatList>(null)
  const groups = useMemo(() => groupMessages(messages), [messages])

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

  if (groups.length === 0) {
    return <EmptyState title="Todavía no hay mensajes" description="Sé el primero en escribir algo." />
  }

  return (
    <FlatList
      ref={listRef}
      style={styles.list}
      data={groups}
      keyExtractor={(group) => group.items[0].id}
      renderItem={({ item }) => (
        <MessageGroupItem
          group={item}
          onToggleReaction={onToggleReaction}
          onLongPressMessage={onLongPressMessage}
          onPressAuthor={onPressAuthor}
          highlightMessageId={highlightMessageId}
          customEmojis={customEmojis}
        />
      )}
      onContentSizeChange={() => {
        if (!highlightMessageId) listRef.current?.scrollToEnd({ animated: true })
      }}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: info.averageItemLength * info.index,
            animated: true,
          })
        }, 80)
      }}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
})
