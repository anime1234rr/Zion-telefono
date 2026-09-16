import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export interface MessageActionItem {
  key: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  destructive?: boolean
  onPress: () => void
}

export function MessageActionsModal({
  visible,
  actions,
  onClose,
}: {
  visible: boolean
  actions: MessageActionItem[]
  onClose: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              style={styles.row}
              onPress={() => {
                onClose()
                action.onPress()
              }}
            >
              <Ionicons
                name={action.icon}
                size={18}
                color={action.destructive ? colors.destructive : colors.foreground}
              />
              <Text style={[styles.label, action.destructive && styles.labelDestructive]}>
                {action.label}
              </Text>
            </Pressable>
          ))}

          <View style={styles.divider} />

          <Pressable style={styles.row} onPress={onClose}>
            <Text style={styles.cancelLabel}>Cancelar</Text>
          </Pressable>
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
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  label: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  labelDestructive: {
    color: colors.destructive,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  cancelLabel: {
    color: colors.mutedForeground,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
})
