import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { listarServidores } from '@/lib/servers'
import { listarCanales } from '@/lib/channels'
import { listarMiembros, listarRolesDeServidor } from '@/lib/members'
import { listarExpresiones } from '@/lib/expresiones'
import { listarWebhooks } from '@/lib/webhooks'
import { obtenerAutomodConfig, type AutomodConfig } from '@/lib/automod'
import type { ServerHistoryRetention, ServerItem, ServerVerificationLevel } from '@/lib/types'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Props = NativeStackScreenProps<RootStackParamList, 'ServerOverview'>

const NIVEL: Record<ServerVerificationLevel, string> = {
  ninguno: 'Ninguno',
  bajo: 'Bajo',
  medio: 'Medio',
  alto: 'Alto',
}
const RETENCION: Record<ServerHistoryRetention, string> = {
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
  '1a': '1 año',
  para_siempre: 'Para siempre',
}

function resumirAutomod(cfg: AutomodConfig): string {
  const p: string[] = []
  if (cfg.palabrasBloqueadas.length) p.push(`${cfg.palabrasBloqueadas.length} palabra${cfg.palabrasBloqueadas.length === 1 ? '' : 's'}`)
  if (cfg.slowmodeSegundos) p.push(`modo lento ${cfg.slowmodeSegundos < 60 ? `${cfg.slowmodeSegundos} s` : `${cfg.slowmodeSegundos / 60} min`}`)
  if (cfg.edadMinimaHoras) p.push('antigüedad mínima')
  if (cfg.bloquearEnlaces) p.push('sin enlaces')
  if (cfg.maxMenciones) p.push(`máx. ${cfg.maxMenciones} menciones`)
  if (cfg.adjuntosPermitidos === 'solo_imagenes') p.push('solo imágenes')
  if (cfg.adjuntosPermitidos === 'ninguno') p.push('sin adjuntos')
  if (cfg.raidUmbralJoins) p.push('anti-raid')
  return p.length ? p.join(' · ') : 'Sin reglas activas'
}

interface Resumen {
  miembros: number
  canales: number
  canalesVoz: number
  roles: number
  expresiones: number
  webhooks: number
  automod: string
}

export function ServerOverviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<Props['route']>()
  const { serverId } = route.params

  const [server, setServer] = useState<ServerItem | null>(null)
  const [resumen, setResumen] = useState<Resumen | null>(null)

  useFocusEffect(
    useCallback(() => {
      listarServidores()
        .then((s) => setServer(s.find((x) => x.id === serverId) ?? null))
        .catch(() => {})
    }, [serverId])
  )

  useEffect(() => {
    let cancelado = false
    Promise.all([
      listarMiembros(serverId).catch(() => []),
      listarCanales(serverId).catch(() => []),
      listarRolesDeServidor(serverId).catch(() => []),
      listarExpresiones(serverId).catch(() => []),
      listarWebhooks(serverId).catch(() => []),
      obtenerAutomodConfig(serverId).catch(() => null),
    ]).then(([m, cats, roles, expr, wh, am]) => {
      if (cancelado) return
      const canales = cats.flatMap((c) => c.channels)
      setResumen({
        miembros: m.length,
        canales: canales.length,
        canalesVoz: canales.filter((c) => c.type === 'voice').length,
        roles: roles.length,
        expresiones: expr.length,
        webhooks: wh.length,
        automod: am ? resumirAutomod(am) : 'Sin reglas activas',
      })
    })
    return () => {
      cancelado = true
    }
  }, [serverId])

  const stats = [
    { icon: 'people-outline', label: 'Miembros', value: resumen?.miembros },
    { icon: 'chatbubble-outline', label: 'Canales', value: resumen?.canales },
    { icon: 'volume-medium-outline', label: 'De voz', value: resumen?.canalesVoz },
    { icon: 'shield-outline', label: 'Roles', value: resumen?.roles },
    { icon: 'happy-outline', label: 'Expresiones', value: resumen?.expresiones },
    { icon: 'link-outline', label: 'Webhooks', value: resumen?.webhooks },
  ] as const

  const config = server
    ? [
        { label: 'Verificación', value: NIVEL[server.verificationLevel] },
        { label: 'Retención', value: RETENCION[server.historyRetention] },
        {
          label: 'Notificaciones',
          value: server.defaultNotifications === 'todos' ? 'Todos los mensajes' : 'Solo menciones',
        },
        { label: 'Comunidad', value: server.communityEnabled ? 'Activada' : 'No activada' },
        { label: 'AutoMod', value: resumen?.automod ?? '—' },
        ...(server.description ? [{ label: 'Descripción', value: server.description }] : []),
      ]
    : []

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          Resumen de {server?.name ?? 'servidor'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      {!resumen ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.grid}>
            {stats.map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={styles.statTop}>
                  <Ionicons name={s.icon} size={14} color={colors.mutedForeground} />
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
                <Text style={styles.statValue}>{s.value ?? '—'}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
          <View style={styles.list}>
            {config.map((row, i) => (
              <View key={row.label} style={[styles.row, i > 0 && styles.rowBorder]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700', flex: 1, marginHorizontal: spacing.sm },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
  },
  statTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { color: colors.mutedForeground, fontSize: fontSize.xs },
  statValue: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  sectionTitle: { color: colors.mutedForeground, fontSize: fontSize.xs, fontWeight: '700' },
  list: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
  },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { color: colors.foreground, fontSize: fontSize.sm },
  rowValue: { color: colors.mutedForeground, fontSize: fontSize.sm, flex: 1, textAlign: 'right' },
})
