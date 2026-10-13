import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Avatar } from '@/components/Avatar'
import { ScreenContainer } from '@/components/ScreenContainer'
import { formatFullDate } from '@/lib/internal/core-utils'
import { suscribirseAlPanelStaff } from '@/lib/realtime-avisos'
import {
  ETIQUETA_MOTIVO,
  staffListarReportes,
  staffObtenerEvidencias,
  staffResolverReporte,
  type EstadoReporte,
  type EvidenciaStaff,
  type ReporteStaff,
  type SancionPorReporte,
} from '@/lib/reports'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import { EstadoReporteChip, Etiqueta, FiltroChip, TituloSeccion, conAlfa, staffStyles } from '@/screens/staff/staff-ui'

type OpcionSancion = { id: string; label: string; tipo?: SancionPorReporte; minutos?: number }

const OPCIONES_SANCION: OpcionSancion[] = [
  { id: 'ninguna', label: 'Sin sanción' },
  { id: 'advertencia', label: 'Advertencia', tipo: 'advertencia' },
  { id: 'ban_1d', label: 'Ban 1 día', tipo: 'ban_temporal', minutos: 60 * 24 },
  { id: 'ban_7d', label: 'Ban 7 días', tipo: 'ban_temporal', minutos: 60 * 24 * 7 },
  { id: 'ban_30d', label: 'Ban 30 días', tipo: 'ban_temporal', minutos: 60 * 24 * 30 },
  { id: 'permanente', label: 'Suspensión permanente', tipo: 'ban_permanente' },
]

export function StaffReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'StaffReport'>>()
  const [reporte, setReporte] = useState<ReporteStaff>(params.reporte)
  const [evidencias, setEvidencias] = useState<EvidenciaStaff[] | null>(null)
  const [evidenciaError, setEvidenciaError] = useState<string | null>(null)
  const [resolucion, setResolucion] = useState('')
  const [sancionId, setSancionId] = useState('ninguna')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    staffObtenerEvidencias(reporte.id)
      .then((d) => !cancelado && setEvidencias(d))
      .catch((err) => !cancelado && setEvidenciaError(getErrorMessage(err)))
    return () => {
      cancelado = true
    }
  }, [reporte.id])

  useEffect(
    () =>
      suscribirseAlPanelStaff(() => {
        staffListarReportes('todos')
          .then((lista) => {
            const actual = lista.find((r) => r.id === params.reporte.id)
            if (actual) setReporte(actual)
          })
          .catch(() => {})
      }),
    [params.reporte.id]
  )

  const abierto = reporte.estado === 'pendiente' || reporte.estado === 'en_revision'
  const alteradas = evidencias?.filter((e) => !e.integridadOk).length ?? 0

  async function resolver(estado: Exclude<EstadoReporte, 'pendiente'>) {
    setError(null)
    const opcion = OPCIONES_SANCION.find((o) => o.id === sancionId)
    setBusy(true)
    try {
      await staffResolverReporte({
        reporteId: reporte.id,
        estado,
        resolucion,
        sancion: estado === 'resuelto' ? opcion?.tipo : undefined,
        minutos: estado === 'resuelto' ? opcion?.minutos : undefined,
      })
      if (estado === 'en_revision') setReporte((r) => ({ ...r, estado }))
      else navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScreenContainer>
      <View style={staffStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={staffStyles.headerTitulo} numberOfLines={1}>
          Reporte contra {reporte.reportadoNombre}
        </Text>
        <EstadoReporteChip estado={reporte.estado} />
      </View>

      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Persona
          titulo="Reportado"
          nombre={reporte.reportadoNombre}
          avatar={reporte.reportadoAvatar}
          detalle={`${reporte.reportesContraReportado} ${reporte.reportesContraReportado === 1 ? 'reporte válido o abierto' : 'reportes válidos o abiertos'}`}
          onPress={() =>
            navigation.navigate('StaffUser', {
              id: reporte.reportadoId,
              nombre: reporte.reportadoNombre,
              avatarUrl: reporte.reportadoAvatar,
            })
          }
        />
        <Persona
          titulo="Reportante"
          nombre={reporte.reportanteNombre}
          avatar={reporte.reportanteAvatar}
          detalle={`${reporte.reportesFalsosReportante} ${reporte.reportesFalsosReportante === 1 ? 'reporte falso' : 'reportes falsos'}`}
          alerta={reporte.reportesFalsosReportante > 0}
          onPress={() =>
            navigation.navigate('StaffUser', {
              id: reporte.reportanteId,
              nombre: reporte.reportanteNombre,
              avatarUrl: reporte.reportanteAvatar,
            })
          }
        />

        <View style={staffStyles.card}>
          <View style={styles.filaChica}>
            <Etiqueta texto={ETIQUETA_MOTIVO[reporte.motivo]} color={colors.destructive} />
          </View>
          <Text style={staffStyles.texto}>{reporte.descripcion}</Text>
          <Text style={staffStyles.meta}>Enviado {formatFullDate(reporte.creadoAt)}</Text>
          {reporte.resolucion ? (
            <View style={styles.resolucion}>
              <Text style={staffStyles.meta}>
                Resolución{reporte.revisadoPorNombre ? ` de ${reporte.revisadoPorNombre}` : ''}: {reporte.resolucion}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.filaTitulo}>
          <TituloSeccion>Evidencia</TituloSeccion>
          {evidencias ? (
            <View style={styles.filaChica}>
              <Ionicons
                name={alteradas === 0 ? 'shield-checkmark' : 'shield-outline'}
                size={14}
                color={alteradas === 0 ? colors.online : colors.destructive}
              />
              <Text style={[staffStyles.meta, { color: alteradas === 0 ? colors.online : colors.destructive }]}>
                {alteradas === 0 ? 'Copias íntegras' : `${alteradas} copias no coinciden`}
              </Text>
            </View>
          ) : null}
        </View>
        {evidenciaError ? <Text style={staffStyles.error}>{evidenciaError}</Text> : null}
        {!evidencias && !evidenciaError ? <ActivityIndicator color={colors.primary} /> : null}
        {evidencias?.map((e) => (
          <View key={e.id} style={staffStyles.card}>
            <Text style={staffStyles.meta}>
              {e.origen === 'directo' ? '✉︎ ' : '# '}
              {e.contexto} · {formatFullDate(e.mensajeCreadoAt)}
              {e.editado ? ' · ya estaba editado' : ''}
            </Text>
            <View style={styles.filaChica}>
              {!e.sigueExistiendo ? <Etiqueta texto="Borrado después del reporte" color={colors.idle} /> : null}
              {e.cambioDespues ? <Etiqueta texto="Editado después del reporte" color={colors.idle} /> : null}
              {!e.integridadOk ? <Etiqueta texto="La copia no coincide con su huella" color={colors.destructive} /> : null}
            </View>
            {e.contenido ? <Text style={staffStyles.texto}>{e.contenido}</Text> : null}
            {e.adjuntoUrl ? (
              e.adjuntoTipo?.startsWith('image') ? (
                <Pressable onPress={() => Linking.openURL(e.adjuntoUrl as string)}>
                  <Image source={{ uri: e.adjuntoUrl }} style={styles.adjunto} contentFit="contain" />
                </Pressable>
              ) : (
                <Pressable onPress={() => Linking.openURL(e.adjuntoUrl as string)}>
                  <Text style={styles.enlace}>📎 Ver adjunto{e.adjuntoTipo ? ` (${e.adjuntoTipo})` : ''}</Text>
                </Pressable>
              )
            ) : null}
          </View>
        ))}

        {abierto ? (
          <View style={[staffStyles.card, styles.decision]}>
            <Text style={staffStyles.nombre}>Decisión</Text>
            <Text style={staffStyles.meta}>Sanción para {reporte.reportadoNombre} (solo si lo resolvés)</Text>
            <View style={styles.opciones}>
              {OPCIONES_SANCION.map((o) => (
                <FiltroChip key={o.id} label={o.label} activo={sancionId === o.id} onPress={() => setSancionId(o.id)} />
              ))}
            </View>
            <TextInput
              style={[staffStyles.input, styles.area]}
              value={resolucion}
              onChangeText={setResolucion}
              placeholder="Qué revisaste y por qué tomás esta decisión."
              placeholderTextColor={colors.mutedForeground}
              multiline
              textAlignVertical="top"
            />
            {error ? <Text style={staffStyles.error}>{error}</Text> : null}
            {reporte.estado === 'pendiente' ? (
              <Pressable
                style={[staffStyles.botonSecundario, busy && staffStyles.deshabilitado]}
                disabled={busy}
                onPress={() => resolver('en_revision')}
              >
                <Text style={staffStyles.botonSecundarioTexto}>Tomar en revisión</Text>
              </Pressable>
            ) : null}
            <View style={styles.botones}>
              <Pressable
                style={[staffStyles.botonSecundario, styles.flex, busy && staffStyles.deshabilitado]}
                disabled={busy}
                onPress={() => resolver('falso')}
              >
                <Text style={[staffStyles.botonSecundarioTexto, { color: colors.destructive }]}>Falso</Text>
              </Pressable>
              <Pressable
                style={[staffStyles.botonSecundario, styles.flex, busy && staffStyles.deshabilitado]}
                disabled={busy}
                onPress={() => resolver('descartado')}
              >
                <Text style={staffStyles.botonSecundarioTexto}>Descartar</Text>
              </Pressable>
              <Pressable
                style={[staffStyles.boton, styles.flex, busy && staffStyles.deshabilitado]}
                disabled={busy}
                onPress={() => resolver('resuelto')}
              >
                {busy ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={staffStyles.botonTexto}>Resolver</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  )
}

function Persona({
  titulo,
  nombre,
  avatar,
  detalle,
  alerta,
  onPress,
}: {
  titulo: string
  nombre: string
  avatar: string | null
  detalle: string
  alerta?: boolean
  onPress: () => void
}) {
  return (
    <Pressable style={[staffStyles.card, staffStyles.fila]} onPress={onPress}>
      <Avatar name={nombre} url={avatar ?? undefined} size={38} />
      <View style={styles.flex}>
        <Text style={styles.titulo}>{titulo.toUpperCase()}</Text>
        <Text style={staffStyles.nombre} numberOfLines={1}>
          {nombre}
        </Text>
        <Text style={[staffStyles.meta, alerta && { color: colors.destructive }]}>{detalle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  filaChica: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  filaTitulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { color: colors.mutedForeground, fontSize: 10, fontWeight: '700' },
  resolucion: { backgroundColor: colors.secondary, borderRadius: radius.sm, padding: spacing.sm, marginTop: 4 },
  adjunto: { width: '100%', height: 200, borderRadius: radius.sm, marginTop: 4 },
  enlace: { color: colors.primary, fontSize: fontSize.sm, marginTop: 4 },
  decision: { gap: spacing.sm, borderColor: conAlfa(colors.primary, 0.4) },
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  area: { minHeight: 90 },
  botones: { flexDirection: 'row', gap: spacing.sm },
})
