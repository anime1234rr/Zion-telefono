import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import type { ReplyPreview } from '@/lib/types'

export function MessageComposer({
  placeholder,
  onSubmit,
  onPickAttachment,
  replyingTo,
  onCancelReply,
  sending,
}: {
  placeholder: string
  onSubmit: (text: string) => void | Promise<void>
  onPickAttachment?: () => void | Promise<void>
  replyingTo?: ReplyPreview | null
  onCancelReply?: () => void
  sending?: boolean
}) {
  const [text, setText] = useState('')

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setText('')
    await onSubmit(trimmed)
  }

  return (
    <View style={styles.wrapper}>
      {replyingTo ? (
        <View style={styles.replyBar}>
          <Text style={styles.replyText} numberOfLines={1}>
            Respondiendo a <Text style={styles.replyAuthor}>{replyingTo.authorName}</Text>
          </Text>
          <Pressable onPress={onCancelReply} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        {onPickAttachment ? (
          <Pressable style={styles.iconButton} onPress={onPickAttachment} hitSlop={8}>
            <Ionicons name="add-circle-outline" size={24} color={colors.mutedForeground} />
          </Pressable>
        ) : null}

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          textAlignVertical="top"
          autoCorrect={false}
          spellCheck={false}
          underlineColorAndroid="transparent"
          multiline
        />

        <Pressable
          style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Ionicons name="send" size={16} color={colors.primaryForeground} />
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  replyText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    flex: 1,
  },
  replyAuthor: {
    color: colors.foreground,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  iconButton: {
    paddingBottom: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.foreground,
    backgroundColor: colors.secondary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    minHeight: 40,
    maxHeight: 120,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
})
