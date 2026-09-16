import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { StickerPickerModal } from '@/components/StickerPickerModal'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import type { MentionableMember, ServerRole } from '@/lib/members'
import type { ReplyPreview } from '@/lib/types'

interface Sugerencia {
  key: string
  label: string
  sub?: string
  color?: string
  emojiUrl?: string
  insert: string
}

export function MessageComposer({
  placeholder,
  onSubmit,
  onPickAttachment,
  onSendSticker,
  replyingTo,
  onCancelReply,
  sending,
  members = [],
  roles = [],
  customEmojis,
  stickers = [],
}: {
  placeholder: string
  onSubmit: (text: string) => void | Promise<void>
  onPickAttachment?: () => void | Promise<void>
  onSendSticker?: (nombre: string) => void
  replyingTo?: ReplyPreview | null
  onCancelReply?: () => void
  sending?: boolean
  members?: MentionableMember[]
  roles?: ServerRole[]
  customEmojis?: Map<string, string>
  stickers?: { nombre: string; url: string }[]
}) {
  const [text, setText] = useState('')
  const [stickerOpen, setStickerOpen] = useState(false)

  const sugerencias = useMemo<Sugerencia[]>(() => {
    const mMatch = /(?:^|\s)@([a-zA-Z0-9_]{1,32})$/.exec(text)
    if (mMatch) {
      const q = mMatch[1].toLowerCase()
      const rs: Sugerencia[] = roles
        .filter((r) => !r.esRolBase && r.nombre.toLowerCase().includes(q))
        .slice(0, 3)
        .map((r) => ({ key: `r-${r.id}`, label: `@${r.nombre}`, color: r.color ?? undefined, insert: `@${r.nombre} ` }))
      const ms: Sugerencia[] = members
        .filter(
          (m) => m.username.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)
        )
        .slice(0, 5)
        .map((m) => ({ key: `m-${m.id}`, label: m.displayName, sub: `@${m.username}`, insert: `@${m.username} ` }))
      return [...rs, ...ms]
    }
    const eMatch = /(?:^|\s):([a-zA-Z0-9_]{2,32})$/.exec(text)
    if (eMatch && customEmojis) {
      const q = eMatch[1].toLowerCase()
      return [...customEmojis.entries()]
        .filter(([name]) => name.toLowerCase().includes(q))
        .slice(0, 8)
        .map(([name, url]) => ({ key: `e-${name}`, label: `:${name}:`, emojiUrl: url, insert: `:${name}: ` }))
    }
    return []
  }, [text, members, roles, customEmojis])

  function aplicarSugerencia(s: Sugerencia) {
    setText((prev) => prev.replace(/(?:^|\s)[@:][a-zA-Z0-9_]{0,32}$/, (m) => {
      const lead = /^\s/.test(m) ? m[0] : ''
      return `${lead}${s.insert}`
    }))
  }

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

      {sugerencias.length > 0 ? (
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.suggestions}>
          {sugerencias.map((s) => (
            <Pressable key={s.key} style={styles.suggestion} onPress={() => aplicarSugerencia(s)}>
              {s.emojiUrl ? (
                <Image source={{ uri: s.emojiUrl }} style={styles.suggestionEmoji} />
              ) : s.color ? (
                <View style={[styles.suggestionDot, { backgroundColor: s.color }]} />
              ) : (
                <Ionicons name="at-outline" size={14} color={colors.mutedForeground} />
              )}
              <Text style={styles.suggestionLabel} numberOfLines={1}>
                {s.label}
              </Text>
              {s.sub ? <Text style={styles.suggestionSub}>{s.sub}</Text> : null}
            </Pressable>
          ))}
        </ScrollView>
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

        {onSendSticker && stickers.length > 0 ? (
          <Pressable style={styles.iconButton} onPress={() => setStickerOpen(true)} hitSlop={8}>
            <Ionicons name="happy-outline" size={22} color={colors.mutedForeground} />
          </Pressable>
        ) : null}

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

      <StickerPickerModal
        visible={stickerOpen}
        stickers={stickers}
        onClose={() => setStickerOpen(false)}
        onSelect={(nombre) => {
          setStickerOpen(false)
          onSendSticker?.(nombre)
        }}
      />
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
  replyText: { color: colors.mutedForeground, fontSize: fontSize.xs, flex: 1 },
  replyAuthor: { color: colors.foreground, fontWeight: '600' },
  suggestions: {
    maxHeight: 168,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionEmoji: { width: 18, height: 18 },
  suggestionDot: { width: 10, height: 10, borderRadius: 5 },
  suggestionLabel: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '600', flexShrink: 1 },
  suggestionSub: { color: colors.mutedForeground, fontSize: fontSize.xs },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  iconButton: { paddingBottom: spacing.sm },
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
  sendButtonDisabled: { opacity: 0.5 },
})
