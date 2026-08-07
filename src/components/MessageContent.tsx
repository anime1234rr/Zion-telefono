import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/theme'

const CONTENT_TOKEN_SPLIT_PATTERN = /(@(?:todos|aqu[ií])\b|@[a-zA-Z0-9_]{1,32}\b|:[a-zA-Z0-9_]+:)/gi
const ONLY_EMOJI_PATTERN = /^(\s*:[a-zA-Z0-9_]+:\s*)+$/

export function MessageContent({
  content,
  customEmojis,
  editedAt,
  textStyle,
}: {
  content: string
  customEmojis: Map<string, string>
  editedAt?: string
  textStyle?: StyleProp<TextStyle>
}) {
  const isJumbo = ONLY_EMOJI_PATTERN.test(content)
  const parts = content.split(CONTENT_TOKEN_SPLIT_PATTERN)

  if (isJumbo) {
    return (
      <View style={styles.jumboWrapper}>
        <View style={styles.jumboRow}>
          {parts
            .filter((part) => part.trim().length > 0)
            .map((part, index) => {
              const emojiMatch = /^:([a-zA-Z0-9_]+):$/.exec(part.trim())
              const emojiUrl = emojiMatch ? customEmojis.get(emojiMatch[1]) : undefined
              if (emojiUrl) {
                return (
                  <Image
                    key={index}
                    source={{ uri: emojiUrl }}
                    style={styles.jumboEmoji}
                    resizeMode="contain"
                  />
                )
              }
              return (
                <Text key={index} style={textStyle}>
                  {part}
                </Text>
              )
            })}
        </View>
        {editedAt ? <Text style={styles.edited}>(editado)</Text> : null}
      </View>
    )
  }

  if (parts.length === 1) {
    return (
      <Text style={textStyle}>
        {content}
        {editedAt ? <Text style={styles.edited}> (editado)</Text> : null}
      </Text>
    )
  }

  return (
    <Text style={textStyle}>
      {parts.map((part, index) => {
        if (/^@[a-zA-Z0-9_]+$/i.test(part)) {
          return (
            <Text key={index} style={styles.mention}>
              {part}
            </Text>
          )
        }
        const emojiMatch = /^:([a-zA-Z0-9_]+):$/.exec(part)
        const emojiUrl = emojiMatch ? customEmojis.get(emojiMatch[1]) : undefined
        if (emojiUrl) {
          return <Image key={index} source={{ uri: emojiUrl }} style={styles.inlineEmoji} />
        }
        return part
      })}
      {editedAt ? <Text style={styles.edited}> (editado)</Text> : null}
    </Text>
  )
}

const styles = StyleSheet.create({
  mention: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    color: colors.primary,
    fontWeight: '600',
    borderRadius: radius.sm,
  },
  inlineEmoji: {
    width: 20,
    height: 20,
  },
  jumboWrapper: {
    gap: 4,
  },
  jumboRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  jumboEmoji: {
    width: 48,
    height: 48,
  },
  edited: {
    color: colors.mutedForeground,
    fontSize: 10,
  },
})
