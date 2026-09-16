import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native'

import { colors } from '@/theme/colors'
import { radius } from '@/theme/theme'
import { EVERYONE_MENTION_PATTERN, MENTION_TOKEN_PATTERN } from '@/lib/mentions'

const ONLY_EMOJI_PATTERN = /^(\s*:[a-zA-Z0-9_]+:\s*)+$/

function esMencionFuerte(token: string, currentUsername?: string): boolean {
  if (EVERYONE_MENTION_PATTERN.test(token)) return true
  if (!currentUsername) return false
  return token.slice(1).toLowerCase() === currentUsername.toLowerCase()
}

export function MessageContent({
  content,
  customEmojis,
  editedAt,
  textStyle,
  currentUsername,
}: {
  content: string
  customEmojis: Map<string, string>
  editedAt?: string
  textStyle?: StyleProp<TextStyle>
  currentUsername?: string
}) {
  const isJumbo = ONLY_EMOJI_PATTERN.test(content)
  const parts = content.split(MENTION_TOKEN_PATTERN)

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
        if (/^@(?:todos|aqu[ií])$/i.test(part) || /^@[a-zA-Z0-9_]+$/i.test(part)) {
          const fuerte = esMencionFuerte(part, currentUsername)
          return (
            <Text key={index} style={fuerte ? styles.mentionStrong : styles.mention}>
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
    backgroundColor: 'rgba(99, 102, 241, 0.16)',
    color: colors.primary,
    fontWeight: '600',
    borderRadius: radius.sm,
  },
  mentionStrong: {
    backgroundColor: colors.primary,
    color: colors.primaryForeground,
    fontWeight: '700',
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
