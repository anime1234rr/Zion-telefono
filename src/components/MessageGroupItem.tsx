import { Image } from 'expo-image'
import { useVideoPlayer, VideoView } from 'expo-video'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Avatar } from '@/components/Avatar'
import { MessageContent } from '@/components/MessageContent'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import type { ChatMessage } from '@/lib/types'
import type { MessageGroup } from '@/lib/message-grouping'

function ReactionsRow({
  message,
  onToggleReaction,
}: {
  message: ChatMessage
  onToggleReaction?: (messageId: string, emoji: string) => void
}) {
  if (!message.reactions || message.reactions.length === 0) return null
  return (
    <View style={styles.reactionsRow}>
      {message.reactions.map((reaction) => (
        <Pressable
          key={reaction.emoji}
          style={styles.reactionChip}
          onPress={() => onToggleReaction?.(message.id, reaction.emoji)}
        >
          <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
          <Text style={styles.reactionCount}>{reaction.userIds.length}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function VideoAttachment({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri)
  return (
    <VideoView
      player={player}
      style={styles.attachmentVideo}
      nativeControls
      contentFit="contain"
    />
  )
}

function MessageItemBody({
  message,
  onToggleReaction,
  customEmojis,
}: {
  message: ChatMessage
  onToggleReaction?: (messageId: string, emoji: string) => void
  customEmojis: Map<string, string>
}) {
  return (
    <View style={styles.item}>
      {message.replyTo ? (
        <View style={styles.replyBar}>
          <Text style={styles.replyAuthor}>{message.replyTo.authorName}</Text>
          <Text style={styles.replyPreview} numberOfLines={1}>
            {message.replyTo.preview}
          </Text>
        </View>
      ) : null}

      {message.forwardedFrom ? (
        <Text style={styles.forwardedLabel}>
          Reenviado de {message.forwardedFrom.authorName}
        </Text>
      ) : null}

      {message.code ? (
        <View style={styles.codeBlock}>
          <Text style={styles.codeLanguage}>{message.code.language}</Text>
          <Text style={styles.codeText}>{message.code.code}</Text>
        </View>
      ) : message.content ? (
        <MessageContent
          content={message.content}
          customEmojis={customEmojis}
          editedAt={message.editedAt}
          textStyle={styles.content}
        />
      ) : null}

      {message.attachment?.type === 'image' ? (
        <Image
          source={{ uri: message.attachment.url }}
          style={styles.attachmentImage}
          contentFit="cover"
        />
      ) : null}

      {message.attachment?.type === 'video' ? (
        <VideoAttachment uri={message.attachment.url} />
      ) : null}

      {message.pinned ? <Text style={styles.pinnedLabel}>📌 Fijado</Text> : null}

      <ReactionsRow message={message} onToggleReaction={onToggleReaction} />
    </View>
  )
}

const EMPTY_EMOJIS: Map<string, string> = new Map()

export function MessageGroupItem({
  group,
  onToggleReaction,
  onLongPressMessage,
  highlightMessageId,
  customEmojis = EMPTY_EMOJIS,
}: {
  group: MessageGroup
  onToggleReaction?: (messageId: string, emoji: string) => void
  onLongPressMessage?: (message: ChatMessage) => void
  highlightMessageId?: string | null
  customEmojis?: Map<string, string>
}) {
  return (
    <View style={styles.group}>
      <Avatar name={group.author.name} url={group.author.avatarUrl} size={36} />
      <View style={styles.groupBody}>
        <View style={styles.groupHeader}>
          <Text style={styles.authorName}>{group.author.name}</Text>
          <Text style={styles.timestamp}>{group.timestamp}</Text>
        </View>
        {group.items.map((message) => (
          <Pressable
            key={message.id}
            onLongPress={() => onLongPressMessage?.(message)}
            style={message.id === highlightMessageId ? styles.highlighted : undefined}
          >
            <MessageItemBody
              message={message}
              onToggleReaction={onToggleReaction}
              customEmojis={customEmojis}
            />
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  groupBody: {
    flex: 1,
    gap: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  authorName: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  timestamp: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  item: {
    marginTop: 2,
    gap: spacing.xs,
  },
  highlighted: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: radius.sm,
  },
  content: {
    color: colors.foreground,
    fontSize: fontSize.md,
    lineHeight: 20,
  },
  edited: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  codeBlock: {
    backgroundColor: colors.code,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 4,
  },
  codeLanguage: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  codeText: {
    color: colors.foreground,
    fontFamily: 'monospace',
    fontSize: fontSize.sm,
  },
  attachmentImage: {
    width: '100%',
    maxWidth: 320,
    height: 200,
    borderRadius: radius.md,
  },
  attachmentVideo: {
    width: '100%',
    maxWidth: 320,
    height: 200,
    borderRadius: radius.md,
  },
  pinnedLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
  replyBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.sm,
  },
  replyAuthor: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  replyPreview: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    flexShrink: 1,
  },
  forwardedLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  reactionEmoji: {
    fontSize: fontSize.sm,
  },
  reactionCount: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
  },
})
