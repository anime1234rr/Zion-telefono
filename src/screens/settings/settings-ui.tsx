import type { ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'

import { ScreenContainer } from '@/components/ScreenContainer'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

export function SettingsLayout({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: ReactNode }) {
  const navigation = useNavigation()
  return (
    <ScreenContainer>
      <View style={settingsStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={settingsStyles.headerTitulo}>{titulo}</Text>
      </View>
      <ScrollView contentContainerStyle={settingsStyles.contenido}>
        {descripcion ? <Text style={settingsStyles.descripcion}>{descripcion}</Text> : null}
        {children}
      </ScrollView>
    </ScreenContainer>
  )
}

export function Grupo({ titulo, children }: { titulo?: string; children: ReactNode }) {
  return (
    <View style={settingsStyles.grupo}>
      {titulo ? <Text style={settingsStyles.grupoTitulo}>{titulo.toUpperCase()}</Text> : null}
      <View style={settingsStyles.tarjeta}>{children}</View>
    </View>
  )
}

export function FilaInterruptor({
  titulo,
  descripcion,
  valor,
  onChange,
  deshabilitado,
}: {
  titulo: string
  descripcion?: string
  valor: boolean
  onChange: (v: boolean) => void
  deshabilitado?: boolean
}) {
  return (
    <View style={settingsStyles.fila}>
      <View style={settingsStyles.filaTexto}>
        <Text style={settingsStyles.filaTitulo}>{titulo}</Text>
        {descripcion ? <Text style={settingsStyles.filaDescripcion}>{descripcion}</Text> : null}
      </View>
      <Switch
        value={valor}
        onValueChange={onChange}
        disabled={deshabilitado}
        trackColor={{ true: colors.primary, false: colors.secondary }}
      />
    </View>
  )
}

export function FilaAccion({
  icono,
  titulo,
  descripcion,
  detalle,
  peligro,
  onPress,
}: {
  icono?: keyof typeof Ionicons.glyphMap
  titulo: string
  descripcion?: string
  detalle?: string
  peligro?: boolean
  onPress?: () => void
}) {
  const color = peligro ? colors.destructive : colors.foreground
  return (
    <Pressable style={({ pressed }) => [settingsStyles.fila, pressed && onPress ? settingsStyles.presionada : null]} onPress={onPress} disabled={!onPress}>
      {icono ? <Ionicons name={icono} size={20} color={peligro ? colors.destructive : colors.mutedForeground} /> : null}
      <View style={settingsStyles.filaTexto}>
        <Text style={[settingsStyles.filaTitulo, { color }]}>{titulo}</Text>
        {descripcion ? <Text style={settingsStyles.filaDescripcion}>{descripcion}</Text> : null}
      </View>
      {detalle ? <Text style={settingsStyles.detalle}>{detalle}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} /> : null}
    </Pressable>
  )
}

export const settingsStyles = StyleSheet.create({
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
  contenido: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  descripcion: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  grupo: { gap: spacing.xs },
  grupoTitulo: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '700' },
  tarjeta: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  presionada: { backgroundColor: colors.secondary },
  filaTexto: { flex: 1, gap: 2 },
  filaTitulo: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '500' },
  filaDescripcion: { color: colors.mutedForeground, fontSize: fontSize.xs, lineHeight: 17 },
  detalle: { color: colors.mutedForeground, fontSize: fontSize.sm },
  nota: { color: colors.mutedForeground, fontSize: fontSize.xs, lineHeight: 17 },
  error: { color: colors.destructive, fontSize: fontSize.sm },
})
