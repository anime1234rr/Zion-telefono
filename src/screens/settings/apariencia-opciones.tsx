import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { aparienciaActual, guardarApariencia, type PreferenciasApariencia } from '@/theme/apariencia'
import { ACENTOS, alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function useCambiarApariencia() {
  const [pref, setPref] = useState<PreferenciasApariencia>(aparienciaActual())

  function cambiar<K extends keyof PreferenciasApariencia>(clave: K, valor: PreferenciasApariencia[K]) {
    if (pref[clave] === valor) return
    const nueva = { ...pref, [clave]: valor }
    setPref(nueva)
    guardarApariencia(nueva).catch(() => {})
  }

  return { pref, cambiar }
}

export function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
}: {
  opciones: { valor: T; label: string }[]
  valor: T
  onChange: (v: T) => void
}) {
  return (
    <View style={styles.segmentado}>
      {opciones.map((o) => (
        <Pressable
          key={o.valor}
          style={[styles.opcion, valor === o.valor && styles.opcionActiva]}
          onPress={() => onChange(o.valor)}
        >
          <Text style={[styles.opcionTexto, valor === o.valor && styles.opcionTextoActivo]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function SelectorAcento({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.acentos}>
      {ACENTOS.map((a) => (
        <Pressable
          key={a.id}
          accessibilityLabel={a.label}
          style={[styles.acento, { backgroundColor: a.color }, valor === a.color && styles.acentoActivo]}
          onPress={() => onChange(a.color)}
        >
          {valor === a.color ? <Ionicons name="checkmark" size={18} color="#ffffff" /> : null}
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  segmentado: { flexDirection: 'row', gap: spacing.xs, padding: spacing.md, flexWrap: 'wrap' },
  opcion: {
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  opcionActiva: { borderColor: colors.primary, backgroundColor: alfa(colors.primary, 0.12) },
  opcionTexto: { color: colors.mutedForeground, fontSize: fontSize.sm, fontWeight: '600' },
  opcionTextoActivo: { color: colors.foreground },
  acentos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, padding: spacing.md },
  acento: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  acentoActivo: { borderWidth: 3, borderColor: colors.foreground },
})
