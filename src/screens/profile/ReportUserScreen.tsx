import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import {
  DESCRIPCION_MAXIMA,
  DESCRIPCION_MINIMA,
  MAX_EVIDENCIAS,
  MOTIVOS_REPORTE,
  crearReporteUsuario,
  listarMensajesReportables,
  type MensajeReportable,
  type MotivoReporte,
} from '@/lib/reports'
import { relativeTime } from '@/lib/internal/core-utils'
import { getErrorMessage } from '@/lib/utils'
import type { RootStackParamList } from '@/navigation/types'
import { alfa, colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Paso = 'motivo' | 'evidencia' | 'detalle' | 'enviado'

export function ReportUserScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const { params } = useRoute<RouteProp<RootStackParamList, 'ReportUser'>>()
  const { userId, userName } = params

  const [paso, setPaso] = useState<Paso>('motivo')
  const [motivo, setMotivo] = useState<MotivoReporte | null>(null)
  const [mensajes, setMensajes] = useState<MensajeReportable[] | null>(null)
  const [cargaError, setCargaError] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [descripcion, setDescripcion] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    listarMensajesReportables(userId)
      .then((data) => !cancelado && setMensajes(data))
      .catch((err) => !cancelado && setCargaError(getErrorMessage(err)))
    return () => {
      cancelado = true
    }
  }, [userId])

  function alternar(id: string) {
    setSeleccion((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < MAX_EVIDENCIAS) next.add(id)
      return next
    })
  }

  const largo = descripcion.trim().length
  const puedeEnviar =
    motivo !== null &&
    seleccion.size > 0 &&
    largo >= DESCRIPCION_MINIMA &&
    largo <= DESCRIPCION_MAXIMA &&
    confirmado &&
    !enviando

  async function enviar() {
    if (!puedeEnviar || !motivo || !mensajes) return
    setError(null)
    setEnviando(true)
    try {
      await crearReporteUsuario({
        reportadoId: userId,
        motivo,
        descripcion,
        evidencias: mensajes.filter((m) => seleccion.has(m.id)).map((m) => ({ origen: m.origen, id: m.id })),
      })
      setPaso('enviado')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  function atras() {
    if (paso === 'detalle') setPaso('evidencia')
    else if (paso === 'evidencia') setPaso('motivo')
    else navigation.goBack()
  }

  if (paso === 'enviado') {
    return (
      <ScreenContainer>
        <View style={styles.done}>
          <Ionicons name="checkmark-circle" size={48} color={colors.online} />
          <Text style={styles.doneTitle}>Reporte enviado</Text>
          <Text style={styles.doneText}>
            El equipo de Zion va a revisar la evidencia. Te avisamos con una notificación cuando el reporte se
            cierre. {userName} no va a saber quién lo reportó.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryLabel}>Listo</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    )
  }

  const subtitulo =
    paso === 'motivo'
      ? 'Paso 1 de 3 · ¿Qué está pasando?'
      : paso === 'evidencia'
        ? `Paso 2 de 3 · Elegí los mensajes que lo demuestran (hasta ${MAX_EVIDENCIAS}).`
        : 'Paso 3 de 3 · Contanos qué pasó.'

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={atras} hitSlop={8} disabled={enviando}>
            <Ionicons name={paso === 'motivo' ? 'close' : 'chevron-back'} size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              Reportar a {userName}
            </Text>
            <Text style={styles.subtitle}>{subtitulo}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {paso === 'motivo' &&
            MOTIVOS_REPORTE.map((m) => (
              <Pressable
                key={m.valor}
                style={[styles.option, motivo === m.valor && styles.optionDanger]}
                onPress={() => setMotivo(m.valor)}
              >
                <Text style={styles.optionTitle}>{m.label}</Text>
                <Text style={styles.optionText}>{m.descripcion}</Text>
              </Pressable>
            ))}

          {paso === 'evidencia' && (
            <>
              <View style={styles.notice}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
                <Text style={styles.noticeText}>
                  Solo podés adjuntar mensajes reales de {userName} que vos podés ver. Al enviar se guarda una copia
                  verificable de cada uno, aunque después los edite o los borre. No se aceptan capturas de pantalla.
                </Text>
              </View>
              {cargaError ? <Text style={styles.error}>{cargaError}</Text> : null}
              {!mensajes && !cargaError ? <ActivityIndicator color={colors.primary} /> : null}
              {mensajes && mensajes.length === 0 ? (
                <Text style={styles.optionText}>
                  No encontramos mensajes de {userName} que puedas ver. Sin evidencia no se puede enviar un reporte.
                </Text>
              ) : null}
              {mensajes?.map((mensaje) => {
                const elegido = seleccion.has(mensaje.id)
                const lleno = !elegido && seleccion.size >= MAX_EVIDENCIAS
                return (
                  <Pressable
                    key={mensaje.id}
                    style={[styles.option, styles.messageRow, elegido && styles.optionActive, lleno && styles.disabled]}
                    onPress={() => alternar(mensaje.id)}
                    disabled={lleno}
                  >
                    <Ionicons
                      name={elegido ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={elegido ? colors.primary : colors.mutedForeground}
                    />
                    <View style={styles.flex}>
                      <Text style={styles.meta} numberOfLines={1}>
                        {mensaje.contexto} · {relativeTime(mensaje.creadoAt)}
                        {mensaje.editado ? ' · editado' : ''}
                      </Text>
                      {mensaje.contenido ? (
                        <Text style={styles.messageText} numberOfLines={4}>
                          {mensaje.contenido}
                        </Text>
                      ) : null}
                      {mensaje.adjuntoUrl ? (
                        <Text style={styles.meta}>
                          📎 Adjunto{mensaje.adjuntoTipo ? ` (${mensaje.adjuntoTipo})` : ''}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                )
              })}
            </>
          )}

          {paso === 'detalle' && (
            <>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={styles.textArea}
                value={descripcion}
                onChangeText={(text) => setDescripcion(text.slice(0, DESCRIPCION_MAXIMA))}
                placeholder="Explicá qué pasó, cuándo y por qué los mensajes elegidos infringen las normas."
                placeholderTextColor={colors.mutedForeground}
                selectionColor={colors.primary}
                cursorColor={colors.primary}
                multiline
                textAlignVertical="top"
                autoFocus
              />
              <Text style={[styles.counter, largo >= DESCRIPCION_MINIMA && styles.counterOk]}>
                {largo < DESCRIPCION_MINIMA
                  ? `Faltan ${DESCRIPCION_MINIMA - largo} caracteres`
                  : `${largo}/${DESCRIPCION_MAXIMA}`}
              </Text>
              <Text style={styles.optionText}>
                {seleccion.size} {seleccion.size === 1 ? 'mensaje adjunto' : 'mensajes adjuntos'} como evidencia.
              </Text>
              <Pressable style={styles.confirmRow} onPress={() => setConfirmado((v) => !v)}>
                <Ionicons
                  name={confirmado ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={confirmado ? colors.primary : colors.mutedForeground}
                />
                <Text style={[styles.optionText, styles.flex]}>
                  Confirmo que este reporte es verdadero. Sé que los reportes falsos pueden limitar mi capacidad de
                  reportar y llevar a sanciones en mi cuenta.
                </Text>
              </Pressable>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {paso === 'motivo' && (
            <Pressable
              style={[styles.primaryButton, !motivo && styles.disabled]}
              disabled={!motivo}
              onPress={() => setPaso('evidencia')}
            >
              <Text style={styles.primaryLabel}>Siguiente</Text>
            </Pressable>
          )}
          {paso === 'evidencia' && (
            <Pressable
              style={[styles.primaryButton, seleccion.size === 0 && styles.disabled]}
              disabled={seleccion.size === 0}
              onPress={() => setPaso('detalle')}
            >
              <Text style={styles.primaryLabel}>Siguiente ({seleccion.size})</Text>
            </Pressable>
          )}
          {paso === 'detalle' && (
            <Pressable
              style={[styles.primaryButton, styles.dangerButton, !puedeEnviar && styles.disabled]}
              disabled={!puedeEnviar}
              onPress={enviar}
            >
              {enviando ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text style={styles.primaryLabel}>Enviar reporte</Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1 },
  title: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: colors.mutedForeground, fontSize: fontSize.xs, marginTop: 2 },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: alfa(colors.primary, 0.12) },
  optionDanger: { borderColor: colors.destructive, backgroundColor: alfa(colors.destructive, 0.12) },
  optionTitle: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  optionText: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  meta: { color: colors.mutedForeground, fontSize: fontSize.xs },
  messageText: { color: colors.foreground, fontSize: fontSize.sm, marginTop: 2 },
  notice: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeText: { flex: 1, color: colors.mutedForeground, fontSize: fontSize.xs, lineHeight: 17 },
  label: { color: colors.mutedForeground, fontSize: fontSize.xs },
  textArea: {
    minHeight: 130,
    backgroundColor: colors.input,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.foreground,
    fontSize: fontSize.md,
  },
  counter: { alignSelf: 'flex-end', color: colors.mutedForeground, fontSize: fontSize.xs },
  counterOk: { color: colors.online },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  error: { color: colors.destructive, fontSize: fontSize.sm },
  footer: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerButton: { backgroundColor: colors.destructive },
  primaryLabel: { color: colors.primaryForeground, fontSize: fontSize.md, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  doneTitle: { color: colors.foreground, fontSize: fontSize.xl, fontWeight: '700' },
  doneText: { color: colors.mutedForeground, fontSize: fontSize.sm, textAlign: 'center', lineHeight: 19 },
})
