import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { Avatar } from '@/components/Avatar'
import { ScreenContainer } from '@/components/ScreenContainer'
import { UserBadge } from '@/components/UserBadge'
import { useAuth } from '@/hooks/use-auth'
import { useStaffCaps } from '@/hooks/use-staff-caps'
import {
  buscarUsuariosStaff,
  listarSancionesRecientes,
  obtenerEstadisticasSanciones,
  type EstadisticasSanciones,
  type SancionReciente,
  type UsuarioStaffResultado,
} from '@/lib/moderation'
import { ETIQUETA_TIPO_SANCION } from '@/lib/moderation-display'
import { relativeTime } from '@/lib/internal/core-utils'
import { suscribirseAlPanelStaff } from '@/lib/realtime-avisos'
import {
  ETIQUETA_MOTIVO,
  staffContarReportesAbiertos,
  staffListarReportes,
  type FiltroReportes,
  type ReporteStaff,
} from '@/lib/reports'
import {
  obtenerResumenPlataforma,
  staffCambiarListadoServidor,
  staffListarServidores,
  type ResumenPlataforma,
  type ServidorStaff,
} from '@/lib/staff-platform'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import {
  EstadoCuentaChip,
  EstadoReporteChip,
  Etiqueta,
  FiltroChip,
  StatTile,
  TituloSeccion,
  staffStyles,
} from '@/screens/staff/staff-ui'

type Seccion = 'resumen' | 'reportes' | 'usuarios' | 'servidores'
type Nav = NativeStackNavigationProp<RootStackParamList>

function useRefrescoStaff(): number {
  const [clave, setClave] = useState(0)
  useEffect(() => suscribirseAlPanelStaff(() => setClave((k) => k + 1)), [])
  return clave
}

export function StaffPanelScreen() {
  const navigation = useNavigation<Nav>()
  const { user } = useAuth()
  const caps = useStaffCaps(user?.id)
  const [seccion, setSeccion] = useState<Seccion>('resumen')
  const [abiertos, setAbiertos] = useState(0)
  const refresco = useRefrescoStaff()

  useEffect(() => {
    let cancelado = false
    staffContarReportesAbiertos()
      .then((n) => !cancelado && setAbiertos(n))
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [refresco])

  const secciones: { id: Seccion; label: string; icon: keyof typeof Ionicons.glyphMap; badge?: number }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'grid-outline' },
    { id: 'reportes', label: 'Reportes', icon: 'flag-outline', badge: abiertos },
    { id: 'usuarios', label: 'Usuarios', icon: 'people-outline' },
    ...(caps.canGestionarExplorar ? [{ id: 'servidores' as const, label: 'Servidores', icon: 'compass-outline' as const }] : []),
  ]

  return (
    <ScreenContainer>
      <View style={staffStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Ionicons name="shield-half-outline" size={20} color={colors.primary} />
        <Text style={staffStyles.headerTitulo}>Panel de staff</Text>
      </View>

      {caps.loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : !caps.esStaff ? (
        <Text style={staffStyles.vacio}>No tenés acceso al panel de staff.</Text>
      ) : (
        <>
          <View style={styles.tabs}>
            {secciones.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.tab, seccion === s.id && styles.tabActiva]}
                onPress={() => setSeccion(s.id)}
              >
                <Ionicons
                  name={s.icon}
                  size={16}
                  color={seccion === s.id ? colors.foreground : colors.mutedForeground}
                />
                <Text style={[styles.tabTexto, seccion === s.id && styles.tabTextoActivo]} numberOfLines={1}>
                  {s.label}
                </Text>
                {s.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeTexto}>{s.badge}</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>

          {seccion === 'resumen' && (
            <ResumenTab
              refresco={refresco}
              puedeExplorar={caps.canGestionarExplorar}
              onIr={setSeccion}
              onVerUsuario={(u) => navigation.navigate('StaffUser', u)}
            />
          )}
          {seccion === 'reportes' && (
            <ReportesTab refresco={refresco} onAbrir={(reporte) => navigation.navigate('StaffReport', { reporte })} />
          )}
          {seccion === 'usuarios' && <UsuariosTab onVerUsuario={(u) => navigation.navigate('StaffUser', u)} />}
          {seccion === 'servidores' && caps.canGestionarExplorar && <ServidoresTab refresco={refresco} />}
        </>
      )}
    </ScreenContainer>
  )
}

function ResumenTab({
  refresco,
  puedeExplorar,
  onIr,
  onVerUsuario,
}: {
  refresco: number
  puedeExplorar: boolean
  onIr: (s: Seccion) => void
  onVerUsuario: (u: { id: string; nombre: string; avatarUrl: string | null }) => void
}) {
  const [resumen, setResumen] = useState<ResumenPlataforma | null>(null)
  const [stats, setStats] = useState<EstadisticasSanciones | null>(null)
  const [recientes, setRecientes] = useState<SancionReciente[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    obtenerResumenPlataforma()
      .then((d) => !cancelado && setResumen(d))
      .catch(() => {})
    obtenerEstadisticasSanciones()
      .then((d) => !cancelado && setStats(d))
      .catch(() => {})
    listarSancionesRecientes(15)
      .then((d) => !cancelado && setRecientes(d))
      .catch((err) => !cancelado && setError(getErrorMessage(err)))
    return () => {
      cancelado = true
    }
  }, [refresco])

  return (
    <ScrollView contentContainerStyle={styles.contenido}>
      {error ? <Text style={staffStyles.error}>{error}</Text> : null}

      {resumen ? (
        <>
          <TituloSeccion>Plataforma</TituloSeccion>
          <View style={styles.grid}>
            <StatTile label="Usuarios" valor={resumen.usuariosTotales} />
            <StatTile label="Nuevos (7 días)" valor={resumen.usuariosNuevos7Dias} tono="ok" />
            <StatTile label="Servidores" valor={resumen.servidoresTotales} />
            <StatTile
              label="En Explorar"
              valor={resumen.comunidadesEnExplorar}
              onPress={puedeExplorar ? () => onIr('servidores') : undefined}
            />
            <StatTile
              label="Reportes abiertos"
              valor={resumen.reportesAbiertos}
              tono="alerta"
              onPress={() => onIr('reportes')}
            />
            <StatTile label="Reportes (7 días)" valor={resumen.reportesUltimos7Dias} />
          </View>
        </>
      ) : null}

      {stats ? (
        <>
          <TituloSeccion>Sanciones activas</TituloSeccion>
          <View style={styles.grid}>
            <StatTile label="Advertencias" valor={stats.advertenciasActivas} />
            <StatTile label="Bans temporales" valor={stats.bansTemporalesActivos} />
            <StatTile label="Suspensiones" valor={stats.bansPermanentesActivos} />
          </View>
        </>
      ) : null}

      <TituloSeccion>Sanciones recientes</TituloSeccion>
      {!recientes && !error ? <ActivityIndicator color={colors.primary} /> : null}
      {recientes && recientes.length === 0 ? (
        <Text style={staffStyles.vacio}>Todavía no se aplicó ninguna sanción.</Text>
      ) : null}
      {recientes?.map((s) => (
        <Pressable
          key={s.id}
          style={[staffStyles.card, staffStyles.fila]}
          onPress={() => onVerUsuario({ id: s.usuarioId, nombre: s.nombreUsuario, avatarUrl: s.avatarUrl })}
        >
          <Avatar name={s.nombreUsuario} url={s.avatarUrl ?? undefined} size={36} />
          <View style={styles.flex}>
            <Text style={staffStyles.nombre} numberOfLines={1}>
              {s.nombreUsuario} · {ETIQUETA_TIPO_SANCION[s.tipo]}
              {!s.activa ? ' (revocada)' : ''}
            </Text>
            <Text style={staffStyles.meta} numberOfLines={1}>
              {s.motivo}
            </Text>
          </View>
          <Text style={staffStyles.meta}>{relativeTime(s.creadoAt)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const FILTROS_REPORTES: { valor: FiltroReportes; label: string }[] = [
  { valor: 'abiertos', label: 'Abiertos' },
  { valor: 'resuelto', label: 'Resueltos' },
  { valor: 'descartado', label: 'Descartados' },
  { valor: 'falso', label: 'Falsos' },
  { valor: 'todos', label: 'Todos' },
]

function ReportesTab({ refresco, onAbrir }: { refresco: number; onAbrir: (r: ReporteStaff) => void }) {
  const [filtro, setFiltro] = useState<FiltroReportes>('abiertos')
  const [reportes, setReportes] = useState<ReporteStaff[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    staffListarReportes(filtro)
      .then((d) => {
        if (cancelado) return
        setReportes(d)
        setError(null)
      })
      .catch((err) => !cancelado && setError(getErrorMessage(err)))
    return () => {
      cancelado = true
    }
  }, [filtro, refresco])

  return (
    <View style={styles.flex}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsFila}>
        {FILTROS_REPORTES.map((f) => (
          <FiltroChip
            key={f.valor}
            label={f.label}
            activo={filtro === f.valor}
            onPress={() => {
              setFiltro(f.valor)
              setReportes(null)
            }}
          />
        ))}
      </ScrollView>
      {error ? <Text style={[staffStyles.error, styles.margen]}>{error}</Text> : null}
      {!reportes && !error ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}
      {reportes ? (
        <FlatList
          data={reportes}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={<Text style={staffStyles.vacio}>No hay reportes en esta lista.</Text>}
          renderItem={({ item }) => (
            <Pressable style={[staffStyles.card, staffStyles.fila]} onPress={() => onAbrir(item)}>
              <Avatar name={item.reportadoNombre} url={item.reportadoAvatar ?? undefined} size={40} />
              <View style={styles.flex}>
                <View style={styles.filaChica}>
                  <Text style={[staffStyles.nombre, styles.encoger]} numberOfLines={1}>
                    {item.reportadoNombre}
                  </Text>
                  <Etiqueta texto={ETIQUETA_MOTIVO[item.motivo]} color={colors.destructive} />
                </View>
                <Text style={staffStyles.meta} numberOfLines={2}>
                  Por {item.reportanteNombre} · {item.cantidadEvidencias}{' '}
                  {item.cantidadEvidencias === 1 ? 'evidencia' : 'evidencias'} · {item.descripcion}
                </Text>
              </View>
              <View style={styles.derecha}>
                <EstadoReporteChip estado={item.estado} />
                <Text style={staffStyles.meta}>{relativeTime(item.creadoAt)}</Text>
              </View>
            </Pressable>
          )}
        />
      ) : null}
    </View>
  )
}

function UsuariosTab({ onVerUsuario }: { onVerUsuario: (u: { id: string; nombre: string; avatarUrl: string | null }) => void }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<UsuarioStaffResultado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const termino = query.trim()
    if (!termino) return
    let cancelado = false
    const t = setTimeout(() => {
      setBuscando(true)
      buscarUsuariosStaff(termino)
        .then((d) => {
          if (cancelado) return
          setResultados(d)
          setError(null)
        })
        .catch((err) => !cancelado && setError(getErrorMessage(err)))
        .finally(() => !cancelado && setBuscando(false))
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [query])

  const visibles = query.trim() ? resultados : []

  return (
    <View style={styles.flex}>
      <View style={[styles.margen, styles.busqueda]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={styles.busquedaInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre de usuario o nombre"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {buscando ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>
      {error ? <Text style={[staffStyles.error, styles.margen]}>{error}</Text> : null}
      <FlatList
        data={visibles}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.lista}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={staffStyles.vacio}>
            {query.trim()
              ? buscando
                ? 'Buscando…'
                : 'Sin resultados.'
              : 'Buscá a una persona para ver su historial, sancionarla o gestionar su rol de staff.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[staffStyles.card, staffStyles.fila]}
            onPress={() => onVerUsuario({ id: item.id, nombre: item.nombreUsuario, avatarUrl: item.avatarUrl })}
          >
            <Avatar name={item.nombreCompleto || item.nombreUsuario} url={item.avatarUrl ?? undefined} size={40} />
            <View style={styles.flex}>
              <View style={styles.filaChica}>
                <Text style={[staffStyles.nombre, styles.encoger]} numberOfLines={1}>
                  {item.nombreUsuario}
                </Text>
                <UserBadge userId={item.id} size={13} />
              </View>
              <EstadoCuentaChipCompacto estado={item.estadoCuenta} />
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      />
    </View>
  )
}

function EstadoCuentaChipCompacto({ estado }: { estado: UsuarioStaffResultado['estadoCuenta'] }) {
  return (
    <View style={styles.chipCompacto}>
      <EstadoCuentaChip estado={estado} />
    </View>
  )
}

type FiltroServidores = 'todos' | 'explorar' | 'fuera'

function ServidoresTab({ refresco }: { refresco: number }) {
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState<FiltroServidores>('todos')
  const [servidores, setServidores] = useState<ServidorStaff[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    const t = setTimeout(() => {
      staffListarServidores(query)
        .then((d) => {
          if (cancelado) return
          setServidores(d)
          setError(null)
        })
        .catch((err) => !cancelado && setError(getErrorMessage(err)))
    }, 250)
    return () => {
      cancelado = true
      clearTimeout(t)
    }
  }, [query, refresco])

  async function cambiar(servidor: ServidorStaff, listado: boolean) {
    setBusyId(servidor.id)
    setError(null)
    try {
      await staffCambiarListadoServidor(servidor.id, listado)
      setServidores((prev) => prev?.map((s) => (s.id === servidor.id ? { ...s, listadoPorStaff: listado } : s)) ?? prev)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const visibles = (servidores ?? []).filter((s) => {
    const enExplorar = s.comunidadActiva || s.listadoPorStaff
    if (filtro === 'explorar') return enExplorar
    if (filtro === 'fuera') return !enExplorar
    return true
  })

  return (
    <View style={styles.flex}>
      <Text style={[staffStyles.meta, styles.margen]}>
        Agregá cualquier servidor a Explorar aunque no cumpla los requisitos de comunidad. Aparece como destacado.
      </Text>
      <View style={[styles.margen, styles.busqueda]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={styles.busquedaInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Servidor o propietario"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="none"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={styles.chipsFila}>
        <FiltroChip label="Todos" activo={filtro === 'todos'} onPress={() => setFiltro('todos')} />
        <FiltroChip label="En Explorar" activo={filtro === 'explorar'} onPress={() => setFiltro('explorar')} />
        <FiltroChip label="Fuera de Explorar" activo={filtro === 'fuera'} onPress={() => setFiltro('fuera')} />
      </ScrollView>
      {error ? <Text style={[staffStyles.error, styles.margen]}>{error}</Text> : null}
      {!servidores && !error ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null}
      <FlatList
        data={visibles}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={servidores ? <Text style={staffStyles.vacio}>No hay servidores en esta lista.</Text> : null}
        renderItem={({ item }) => (
          <View style={staffStyles.card}>
            <View style={staffStyles.fila}>
              <View style={styles.icono}>
                {item.iconoUrl ? (
                  <Image source={{ uri: item.iconoUrl }} style={styles.iconoImg} contentFit="cover" />
                ) : (
                  <Text style={styles.iconoTexto}>{item.nombre.slice(0, 2).toUpperCase()}</Text>
                )}
              </View>
              <View style={styles.flex}>
                <Text style={staffStyles.nombre} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={staffStyles.meta} numberOfLines={1}>
                  {item.cantidadMiembros} miembros · de {item.propietarioNombre ?? 'desconocido'}
                </Text>
                <View style={[styles.filaChica, { marginTop: 4 }]}>
                  {item.listadoPorStaff ? <Etiqueta texto="Destacado" color={colors.primary} /> : null}
                  {item.comunidadActiva ? <Etiqueta texto="Comunidad" color={colors.online} /> : null}
                </View>
              </View>
            </View>
            <Pressable
              style={[
                item.listadoPorStaff ? staffStyles.botonSecundario : staffStyles.boton,
                busyId === item.id && staffStyles.deshabilitado,
              ]}
              disabled={busyId === item.id}
              onPress={() => cambiar(item, !item.listadoPorStaff)}
            >
              <Text style={item.listadoPorStaff ? staffStyles.botonSecundarioTexto : staffStyles.botonTexto}>
                {item.listadoPorStaff ? 'Quitar de Explorar' : 'Agregar a Explorar'}
              </Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    margin: spacing.md,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  tabActiva: { backgroundColor: colors.background },
  tabTexto: { color: colors.mutedForeground, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  tabTextoActivo: { color: colors.foreground },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTexto: { color: '#fff', fontSize: 10, fontWeight: '700' },
  contenido: { padding: spacing.lg, paddingTop: 0, gap: spacing.sm, paddingBottom: spacing.xxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chips: { flexGrow: 0, flexShrink: 0 },
  chipsFila: { gap: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  lista: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  margen: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  filaChica: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  encoger: { flexShrink: 1 },
  derecha: { alignItems: 'flex-end', gap: 4 },
  chipCompacto: { flexDirection: 'row', marginTop: 4 },
  busqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  busquedaInput: { flex: 1, color: colors.foreground, fontSize: fontSize.md, padding: 0 },
  icono: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconoImg: { width: '100%', height: '100%' },
  iconoTexto: { color: colors.foreground, fontSize: fontSize.sm, fontWeight: '700' },
})
