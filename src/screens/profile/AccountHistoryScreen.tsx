import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { useAuth } from '@/hooks/use-auth'
import { esBanActivo, obtenerMisSanciones, type Sancion } from '@/lib/moderation'
import { ETIQUETA_TIPO_SANCION } from '@/lib/moderation-display'
import { ETIQUETA_MOTIVO, listarMisReportes, type MiReporte } from '@/lib/reports'
import { supabase } from '@/lib/supabase'
import { uniqueId } from '@/lib/id'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { spacing } from '@/theme/theme'
import { EstadoReporteChip, Etiqueta, TituloSeccion, staffStyles } from '@/screens/staff/staff-ui'

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function estadoSancion(sancion: Sancion): { label: string; color: string } {
  if (!sancion.activa) return { label: 'Revocada', color: colors.mutedForeground }
  if (esBanActivo(sancion)) return { label: 'Activa', color: colors.destructive }
  if (sancion.tipo !== 'advertencia') return { label: 'Vencida', color: colors.mutedForeground }
  return { label: 'Advertencia', color: colors.idle }
}

export function AccountHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { user } = useAuth()
  const [sanciones, setSanciones] = useState<Sancion[] | null>(null)
  const [reportes, setReportes] = useState<MiReporte[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(() => {
    obtenerMisSanciones()
      .then((d) => {
        setSanciones(d)
        setError(null)
      })
      .catch((err) => setError(getErrorMessage(err)))
    listarMisReportes()
      .then(setReportes)
      .catch(() => setReportes([]))
  }, [])

  useFocusEffect(cargar)

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`mi-historial-${user.id}-${uniqueId()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reportes_usuario', filter: `reportante_id=eq.${user.id}` },
        cargar
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones', filter: `usuario_id=eq.${user.id}` },
        cargar
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, cargar])

  return (
    <ScreenContainer>
      <View style={staffStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={staffStyles.headerTitulo}>Estado de mi cuenta</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={staffStyles.meta}>
          Acá ves cualquier sanción aplicada a tu cuenta, con el motivo exacto, y el estado de los reportes que enviaste.
        </Text>

        <TituloSeccion>Sanciones</TituloSeccion>
        {error ? <Text style={staffStyles.error}>{error}</Text> : null}
        {!sanciones && !error ? <ActivityIndicator color={colors.primary} /> : null}
        {sanciones && sanciones.length === 0 ? (
          <View style={[staffStyles.card, staffStyles.fila]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.online} />
            <Text style={staffStyles.texto}>Tu cuenta no tiene ninguna sanción.</Text>
          </View>
        ) : null}
        {sanciones?.map((s) => {
          const estado = estadoSancion(s)
          return (
            <View key={s.id} style={staffStyles.card}>
              <View style={styles.filaEntre}>
                <Text style={staffStyles.nombre}>{ETIQUETA_TIPO_SANCION[s.tipo]}</Text>
                <Etiqueta texto={estado.label} color={estado.color} />
              </View>
              <Text style={staffStyles.texto}>{s.motivo}</Text>
              <Text style={staffStyles.meta}>
                Aplicada el {formatFecha(s.creadoAt)}
                {s.tipo === 'ban_temporal' && s.expiraAt ? ` · vence el ${formatFecha(s.expiraAt)}` : ''}
              </Text>
              {!s.activa ? (
                <Text style={staffStyles.meta}>
                  Revocada{s.revocadaAt ? ` el ${formatFecha(s.revocadaAt)}` : ''}
                  {s.revocadaMotivo ? ` — ${s.revocadaMotivo}` : ''}
                </Text>
              ) : null}
            </View>
          )
        })}

        <TituloSeccion>Mis reportes</TituloSeccion>
        {!reportes ? <ActivityIndicator color={colors.primary} /> : null}
        {reportes && reportes.length === 0 ? (
          <Text style={staffStyles.meta}>No enviaste ningún reporte.</Text>
        ) : null}
        {reportes?.map((r) => (
          <View key={r.id} style={staffStyles.card}>
            <View style={styles.filaEntre}>
              <Text style={[staffStyles.nombre, styles.encoger]} numberOfLines={1}>
                {r.reportadoNombre}
              </Text>
              <EstadoReporteChip estado={r.estado} />
            </View>
            <Text style={staffStyles.meta}>
              {ETIQUETA_MOTIVO[r.motivo]} · enviado el {formatFecha(r.creadoAt)}
            </Text>
            {r.resolucion ? <Text style={staffStyles.texto}>{r.resolucion}</Text> : null}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  filaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  encoger: { flexShrink: 1 },
})
