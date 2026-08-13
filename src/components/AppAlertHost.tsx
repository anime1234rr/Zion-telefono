import { useEffect, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'

import { dismissAppAlert, useAppAlert, type AppAlertButton, type AppAlertState } from '@/hooks/use-app-alert'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function AppAlertHost() {
  const alert = useAppAlert()
  const [content, setContent] = useState<AppAlertState | null>(null)

  useEffect(() => {
    if (alert) setContent(alert)
  }, [alert])

  function handlePress(button: AppAlertButton) {
    dismissAppAlert()
    button.onPress?.()
  }

  const buttons = content?.buttons ?? []
  const stacked = buttons.length > 2

  return (
    <Modal visible={alert !== null} transparent animationType="fade" onRequestClose={dismissAppAlert}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{content?.title}</Text>
          {content?.message ? <Text style={styles.message}>{content.message}</Text> : null}

          <View style={[styles.actions, stacked && styles.actionsStacked]}>
            {buttons.map((button, index) => (
              <Pressable
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' ? styles.buttonCancel : styles.buttonFilled,
                  button.style === 'destructive' && styles.buttonDestructive,
                ]}
                onPress={() => handlePress(button)}
              >
                <Text
                  style={[
                    styles.buttonLabel,
                    button.style === 'cancel' && styles.buttonLabelCancel,
                    button.style === 'destructive' && styles.buttonLabelDestructive,
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
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
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  message: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 19,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  actionsStacked: {
    flexDirection: 'column-reverse',
  },
  button: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  buttonFilled: {
    backgroundColor: colors.primary,
  },
  buttonCancel: {
    backgroundColor: 'transparent',
  },
  buttonDestructive: {
    backgroundColor: colors.destructive,
  },
  buttonLabel: {
    color: colors.primaryForeground,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  buttonLabelCancel: {
    color: colors.mutedForeground,
  },
  buttonLabelDestructive: {
    color: '#fff',
  },
})
