import { useMemo, useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { EMOJI_CATEGORIES } from '@/lib/emoji-data'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function EmojiPickerModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean
  onClose: () => void
  onSelect: (emoji: string) => void
}) {
  const [query, setQuery] = useState('')

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return EMOJI_CATEGORIES
    return EMOJI_CATEGORIES.map((category) => ({
      ...category,
      emojis: category.emojis.filter(
        (emoji) => emoji.keywords.includes(q) || emoji.char === q
      ),
    })).filter((category) => category.emojis.length > 0)
  }, [query])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={() => setQuery('')}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Buscar emoji…"
                placeholderTextColor={colors.mutedForeground}
                selectionColor={colors.primary}
                cursorColor={colors.primary}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            <Pressable
              onPress={() => {
                setQuery('')
                onClose()
              }}
              hitSlop={8}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
            {filteredCategories.length === 0 ? (
              <Text style={styles.empty}>No se encontraron emojis.</Text>
            ) : (
              filteredCategories.map((category) => (
                <View key={category.label} style={styles.category}>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                  <View style={styles.grid}>
                    {category.emojis.map((emoji) => (
                      <Pressable
                        key={emoji.char}
                        style={styles.emojiButton}
                        onPress={() => {
                          onSelect(emoji.char)
                          setQuery('')
                          onClose()
                        }}
                      >
                        <Text style={styles.emojiChar}>{emoji.char}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '75%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: spacing.sm,
  },
  empty: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  category: {
    marginBottom: spacing.sm,
  },
  categoryLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emojiButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  emojiChar: {
    fontSize: 22,
  },
})
