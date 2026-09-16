import { Image } from 'expo-image'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function StickerPickerModal({
  visible,
  stickers,
  onClose,
  onSelect,
}: {
  visible: boolean
  stickers: { nombre: string; url: string }[]
  onClose: () => void
  onSelect: (nombre: string) => void
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>Stickers</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          {stickers.length === 0 ? (
            <Text style={styles.empty}>Este servidor no tiene stickers.</Text>
          ) : (
            <ScrollView contentContainerStyle={styles.grid}>
              {stickers.map((s) => (
                <Pressable key={s.nombre} style={styles.cell} onPress={() => onSelect(s.nombre)}>
                  <Image source={{ uri: s.url }} style={styles.sticker} contentFit="contain" />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.xl,
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '700' },
  empty: { color: colors.mutedForeground, fontSize: fontSize.sm, padding: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cell: {
    width: 72,
    height: 72,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sticker: { width: 60, height: 60 },
})
