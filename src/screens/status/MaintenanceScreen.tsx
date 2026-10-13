import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { ScreenContainer } from '@/components/ScreenContainer'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const STATUS_URL = 'https://zion.betteruptime.com/'

export function MaintenanceScreen() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="construct-outline" size={30} color={colors.primary} />
          </View>
          <View style={styles.pill}>
            <View style={styles.dot} />
            <Text style={styles.pillText}>En mantenimiento</Text>
          </View>
          <Text style={styles.title}>Zion está en mantenimiento</Text>
          <Text style={styles.text}>
            Estamos realizando tareas de mantenimiento en el servicio. Volvé a intentarlo en unos minutos.
          </Text>
          <Pressable style={styles.button} onPress={() => Linking.openURL(STATUS_URL)}>
            <Text style={styles.buttonText}>Ver estado del servicio</Text>
            <Ionicons name="open-outline" size={14} color={colors.foreground} />
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
    backgroundColor: alfa(colors.primary, 0.12),
    marginBottom: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: alfa(colors.idle, 0.12),
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.idle },
  pillText: { color: colors.idle, fontSize: fontSize.xs, fontWeight: '600' },
  title: { color: colors.foreground, fontSize: fontSize.xl, fontWeight: '700', textAlign: 'center' },
  text: { color: colors.mutedForeground, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 19 },
  button: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buttonText: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '600' },
})
