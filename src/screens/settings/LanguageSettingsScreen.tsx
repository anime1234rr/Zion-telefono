import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import { Grupo, SettingsLayout, settingsStyles } from '@/screens/settings/settings-ui'

const IDIOMAS = [
  { valor: 'es-AR', label: 'Español', disponible: true },
  { valor: 'en-US', label: 'English', disponible: false },
  { valor: 'pt-BR', label: 'Português', disponible: false },
]

export function LanguageSettingsScreen() {
  return (
    <SettingsLayout titulo="Idioma y región" descripcion="Elegí el idioma de la interfaz de Zion.">
      <Grupo titulo="Idioma">
        {IDIOMAS.map((idioma) => (
          <View key={idioma.valor} style={[settingsStyles.fila, !idioma.disponible && styles.apagado]}>
            <Text style={[settingsStyles.filaTitulo, styles.flex]}>{idioma.label}</Text>
            {idioma.disponible ? (
              <View style={styles.activo}>
                <Ionicons name="checkmark" size={14} color={colors.primary} />
                <Text style={styles.activoTexto}>Activo</Text>
              </View>
            ) : (
              <Text style={styles.pronto}>Próximamente</Text>
            )}
          </View>
        ))}
      </Grupo>
      <Text style={settingsStyles.nota}>
        Zion todavía solo está traducido al español. El formato de fechas y horas sigue la configuración regional de tu
        teléfono.
      </Text>
    </SettingsLayout>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  apagado: { opacity: 0.5 },
  activo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activoTexto: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
  pronto: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    backgroundColor: colors.secondary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
})
