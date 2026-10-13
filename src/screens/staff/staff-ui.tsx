import { Pressable, StyleSheet, Text, View } from 'react-native'

import type { EstadoCuenta } from '@/lib/moderation'
import { ESTADO_CUENTA_CONFIG } from '@/lib/moderation-display'
import { ETIQUETA_ESTADO_REPORTE, type EstadoReporte } from '@/lib/reports'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

const COLOR_ESTADO_REPORTE: Record<EstadoReporte, string> = {
  pendiente: colors.idle,
  en_revision: colors.primary,
  resuelto: colors.online,
  descartado: colors.mutedForeground,
  falso: colors.destructive,
}

export function conAlfa(hex: string, alfa: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alfa})`
}

export function Etiqueta({ texto, color }: { texto: string; color: string }) {
  return (
    <View style={[staffStyles.etiqueta, { backgroundColor: conAlfa(color, 0.15) }]}>
      <Text style={[staffStyles.etiquetaTexto, { color }]}>{texto}</Text>
    </View>
  )
}

export function EstadoReporteChip({ estado }: { estado: EstadoReporte }) {
  return <Etiqueta texto={ETIQUETA_ESTADO_REPORTE[estado]} color={COLOR_ESTADO_REPORTE[estado]} />
}

export function EstadoCuentaChip({ estado }: { estado: EstadoCuenta }) {
  const config = ESTADO_CUENTA_CONFIG[estado]
  return <Etiqueta texto={config.label} color={config.color} />
}

export function FiltroChip({
  label,
  activo,
  onPress,
}: {
  label: string
  activo: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={[staffStyles.chip, activo && staffStyles.chipActivo]} onPress={onPress}>
      <Text style={[staffStyles.chipTexto, activo && staffStyles.chipTextoActivo]}>{label}</Text>
    </Pressable>
  )
}

export function StatTile({
  label,
  valor,
  tono,
  onPress,
}: {
  label: string
  valor: number
  tono?: 'alerta' | 'ok'
  onPress?: () => void
}) {
  const color =
    tono === 'alerta' && valor > 0 ? colors.destructive : tono === 'ok' ? colors.online : colors.foreground
  return (
    <Pressable style={staffStyles.tile} onPress={onPress} disabled={!onPress}>
      <Text style={[staffStyles.tileValor, { color }]}>{valor}</Text>
      <Text style={staffStyles.tileLabel}>{label}</Text>
    </Pressable>
  )
}

export function TituloSeccion({ children }: { children: string }) {
  return <Text style={staffStyles.titulo}>{children.toUpperCase()}</Text>
}

export const staffStyles = StyleSheet.create({
  etiqueta: { borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  etiquetaTexto: { fontSize: 11, fontWeight: '700' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipActivo: { borderColor: colors.primary, backgroundColor: conAlfa(colors.primary, 0.12) },
  chipTexto: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '600' },
  chipTextoActivo: { color: colors.foreground },
  tile: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.card,
  },
  tileValor: { fontSize: fontSize.xl, fontWeight: '700' },
  tileLabel: { color: colors.mutedForeground, fontSize: 11, textAlign: 'center' },
  titulo: {
    color: colors.mutedForeground,
    fontSize: fontSize.xs,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nombre: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  meta: { color: colors.mutedForeground, fontSize: fontSize.xs },
  texto: { color: colors.foreground, fontSize: fontSize.sm, lineHeight: 19 },
  error: { color: colors.destructive, fontSize: fontSize.sm },
  vacio: { color: colors.mutedForeground, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.xl },
  boton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: { color: colors.primaryForeground, fontSize: fontSize.sm, fontWeight: '600' },
  botonSecundario: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundarioTexto: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '600' },
  deshabilitado: { opacity: 0.5 },
  input: {
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitulo: { flex: 1, color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
})
