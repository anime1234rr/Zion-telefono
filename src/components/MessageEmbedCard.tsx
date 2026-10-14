import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'

import { useAppSettings } from '@/lib/app-settings'
import type { MessageEmbed } from '@/lib/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function MessageEmbedCard({ embed }: { embed: MessageEmbed }) {
  const { subrayarEnlaces } = useAppSettings()
  return (
    <View style={[styles.card, embed.color ? { borderLeftColor: embed.color, borderLeftWidth: 4 } : null]}>
      {embed.title ? (
        embed.url ? (
          <Pressable onPress={() => Linking.openURL(embed.url as string)}>
            <Text style={[styles.titulo, styles.enlace, subrayarEnlaces && styles.subrayado]}>
              {embed.title}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.titulo}>{embed.title}</Text>
        )
      ) : null}
      {embed.description ? <Text style={styles.descripcion}>{embed.description}</Text> : null}
      {embed.fields && embed.fields.length > 0 ? (
        <View style={styles.campos}>
          {embed.fields.map((campo, i) => (
            <View key={i} style={styles.campo}>
              <Text style={styles.campoNombre} numberOfLines={1}>
                {campo.name}
              </Text>
              <Text style={styles.campoValor}>{campo.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {embed.imageUrl ? <Image source={{ uri: embed.imageUrl }} style={styles.imagen} contentFit="contain" /> : null}
      {embed.footer ? <Text style={styles.pie}>{embed.footer}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginTop: 6,
    maxWidth: 360,
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.secondary,
    padding: spacing.md,
  },
  titulo: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '700' },
  enlace: { color: colors.primary },
  subrayado: { textDecorationLine: 'underline' },
  descripcion: { color: colors.foreground, fontSize: fontSize.sm, lineHeight: 19, opacity: 0.9 },
  campos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  campo: { width: '47%' },
  campoNombre: { color: colors.foreground, fontSize: fontSize.xs, fontWeight: '700' },
  campoValor: { color: colors.mutedForeground, fontSize: fontSize.xs },
  imagen: { width: '100%', height: 200, borderRadius: radius.sm, marginTop: 4 },
  pie: { color: colors.mutedForeground, fontSize: 11, marginTop: 4 },
})
