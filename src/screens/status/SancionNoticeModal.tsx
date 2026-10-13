import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { reconocerSancion, type Sancion } from '@/lib/moderation'
import { getErrorMessage } from '@/lib/utils'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SancionNoticeModal({ sancion, onAcknowledged }: { sancion: Sancion; onAcknowledged: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirmar() {
    setLoading(true)
    setError(null)
    try {
      await reconocerSancion(sancion.id)
      onAcknowledged()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="warning-outline" size={26} color={colors.idle} />
          </View>
          <Text style={styles.title}>Recibiste una advertencia</Text>
          <Text style={styles.date}>Aplicada el {formatFecha(sancion.creadoAt)}</Text>
          <View style={styles.reason}>
            <Text style={styles.reasonText}>{sancion.motivo}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={[styles.button, loading && styles.disabled]} onPress={confirmar} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Entendido</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alfa(colors.idle, 0.12),
  },
  title: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  date: { color: colors.mutedForeground, fontSize: fontSize.xs },
  reason: {
    alignSelf: 'stretch',
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reasonText: { color: colors.foreground, fontSize: fontSize.sm, lineHeight: 19 },
  error: { color: colors.destructive, fontSize: fontSize.sm },
  button: {
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonText: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '600' },
  disabled: { opacity: 0.6 },
})
