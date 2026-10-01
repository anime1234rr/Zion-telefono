import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import type { PlantillaCanalPreview, PlantillaServidorDetalle } from '@/lib/templates'

const iconByType: Record<string, keyof typeof Ionicons.glyphMap> = {
  texto: 'chatbubble-outline',
  voz: 'volume-medium-outline',
  codigo: 'code-slash-outline',
  anuncios: 'megaphone-outline',
}

const SIN_CATEGORIA = '__sin_categoria__'

function agruparCanalesPorCategoria(canales: PlantillaCanalPreview[]) {
  const grupos: { categoria: string | null; canales: PlantillaCanalPreview[] }[] = []
  const indicePorCategoria = new Map<string, number>()

  for (const canal of canales) {
    const clave = canal.categoria?.trim() || SIN_CATEGORIA
    let indice = indicePorCategoria.get(clave)
    if (indice === undefined) {
      indice = grupos.length
      indicePorCategoria.set(clave, indice)
      grupos.push({ categoria: clave === SIN_CATEGORIA ? null : clave, canales: [] })
    }
    grupos[indice].canales.push(canal)
  }

  return grupos
}

export function PlantillaPreview({ plantilla }: { plantilla: PlantillaServidorDetalle }) {
  const grupos = agruparCanalesPorCategoria(plantilla.canales)

  return (
    <View style={styles.container}>
      {grupos.map((grupo, index) => (
        <View key={grupo.categoria ?? index} style={styles.grupo}>
          {grupo.categoria && <Text style={styles.categoria}>{grupo.categoria}</Text>}
          <View style={styles.chips}>
            {grupo.canales.map((canal) => (
              <View key={canal.nombre} style={styles.chip}>
                <Ionicons name={iconByType[canal.tipo] ?? 'chatbubble-outline'} size={12} color={colors.mutedForeground} />
                <Text style={styles.chipText}>{canal.nombre}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {plantilla.roles.length > 0 && (
        <View style={styles.chips}>
          {plantilla.roles.map((rol) => (
            <View key={rol.nombre} style={styles.roleChip}>
              <Text style={styles.chipText}>{rol.nombre}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  grupo: {
    gap: 4,
  },
  categoria: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
})
