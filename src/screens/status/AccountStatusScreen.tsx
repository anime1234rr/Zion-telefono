import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import type { Sancion } from '@/lib/moderation'
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

export function AccountStatusScreen({ ban, onSignOut }: { ban: Sancion; onSignOut: () => void }) {
  const esPermanente = ban.tipo === 'ban_permanente'

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="shield-outline" size={30} color={colors.destructive} />
          </View>
          <View style={styles.pill}>
            <View style={styles.dot} />
            <Text style={styles.pillText}>{esPermanente ? 'Suspensión permanente' : 'Suspensión temporal'}</Text>
          </View>
          <Text style={styles.title}>Tu cuenta está suspendida</Text>
          <Text style={styles.text}>{ban.motivo}</Text>
          {!esPermanente && ban.expiraAt ? (
            <Text style={styles.text}>
              Vuelve a estar activa el <Text style={styles.bold}>{formatFecha(ban.expiraAt)}</Text>.
            </Text>
          ) : null}
          <Text style={styles.hint}>Si creés que es un error, podés pedir una revisión desde Ayuda y soporte.</Text>
          <Pressable style={styles.button} onPress={onSignOut}>
            <Text style={styles.buttonText}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: alfa(colors.destructive, 0.12),
    marginBottom: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: alfa(colors.destructive, 0.12),
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.destructive },
  pillText: { color: colors.destructive, fontSize: fontSize.xs, fontWeight: '600' },
  title: { color: colors.foreground, fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  text: { color: colors.mutedForeground, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 19 },
  bold: { color: colors.foreground, fontWeight: '700' },
  hint: { color: colors.mutedForeground, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xs },
  button: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '600' },
})
