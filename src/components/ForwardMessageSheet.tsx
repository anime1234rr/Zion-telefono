import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { Avatar } from '@/components/Avatar'
import { listarCanales } from '@/lib/channels'
import { enviarMensajeDirecto, listarConversaciones } from '@/lib/dms'
import { enviarMensaje } from '@/lib/messages'
import { listarServidores } from '@/lib/servers'
import type { ChannelCategory, ChatMessage, DMConversation, ServerItem } from '@/lib/types'
import { getErrorMessage } from '@/lib/utils'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Pestana = 'canales' | 'dms'

export function ForwardMessageSheet({
  message,
  sourceLabel,
  currentUserId,
  onClose,
}: {
  message: ChatMessage | null
  sourceLabel: string
  currentUserId: string
  onClose: () => void
}) {
  const [pestana, setPestana] = useState<Pestana>('canales')
  const [servidores, setServidores] = useState<ServerItem[] | null>(null)
  const [conversaciones, setConversaciones] = useState<DMConversation[]>([])
  const [canales, setCanales] = useState<Record<string, ChannelCategory[]>>({})
  const [abierto, setAbierto] = useState<string | null>(null)
  const [enviando, setEnviando] = useState<string | null>(null)
  const [enviados, setEnviados] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!message) return
    setEnviados(new Set())
    setError(null)
    Promise.all([listarServidores(), listarConversaciones(currentUserId)])
      .then(([s, c]) => {
        setServidores(s)
        setConversaciones(c)
      })
      .catch((err) => setError(getErrorMessage(err)))
  }, [message, currentUserId])

  if (!message) return null
  const mensaje = message

  const reenviadoDe = { autorId: mensaje.author.id, autorNombre: mensaje.author.name, origen: sourceLabel }
  const cuerpo = { content: mensaje.content, code: mensaje.code, attachment: mensaje.attachment, reenviadoDe }

  async function abrirServidor(id: string) {
    setAbierto((prev) => (prev === id ? null : id))
    if (canales[id]) return
    try {
      const data = await listarCanales(id)
      setCanales((prev) => ({ ...prev, [id]: data }))
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function enviar(destino: string, accion: () => Promise<unknown>) {
    setEnviando(destino)
    setError(null)
    try {
      await accion()
      setEnviados((prev) => new Set(prev).add(destino))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setEnviando(null)
    }
  }

  function estado(destino: string) {
    if (enviando === destino) return <ActivityIndicator size="small" color={colors.primary} />
    if (enviados.has(destino)) return <Ionicons name="checkmark-circle" size={20} color={colors.online} />
    return <Ionicons name="paper-plane-outline" size={18} color={colors.mutedForeground} />
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.fondo} onPress={onClose}>
        <Pressable style={styles.hoja} onPress={() => {}}>
          <View style={styles.cabecera}>
            <Text style={styles.titulo}>Reenviar mensaje</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.vista}>
            <Text style={styles.meta}>De {mensaje.author.name}</Text>
            <Text style={styles.texto} numberOfLines={3}>
              {mensaje.content || (mensaje.code ? 'Fragmento de código' : 'Adjunto')}
            </Text>
          </View>

          <View style={styles.tabs}>
            {(
              [
                ['canales', 'Canales'],
                ['dms', 'Mensajes directos'],
              ] as const
            ).map(([valor, label]) => (
              <Pressable key={valor} style={[styles.tab, pestana === valor && styles.tabActiva]} onPress={() => setPestana(valor)}>
                <Text style={[styles.tabTexto, pestana === valor && styles.tabTextoActivo]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!servidores && !error ? <ActivityIndicator color={colors.primary} /> : null}

          <ScrollView style={styles.lista}>
            {pestana === 'canales' &&
              servidores?.map((s) => (
                <View key={s.id}>
                  <Pressable style={styles.fila} onPress={() => abrirServidor(s.id)}>
                    <Avatar name={s.name} url={s.iconUrl} size={30} />
                    <Text style={[styles.texto, styles.flex]} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Ionicons name={abierto === s.id ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
                  </Pressable>
                  {abierto === s.id
                    ? (canales[s.id] ?? [])
                        .flatMap((c) => c.channels)
                        .filter((c) => c.type === 'text' || c.type === 'announcement' || c.type === 'code')
                        .map((c) => (
                          <Pressable
                            key={c.id}
                            style={[styles.fila, styles.canal]}
                            disabled={enviando !== null || enviados.has(c.id)}
                            onPress={() => enviar(c.id, () => enviarMensaje(c.id, currentUserId, cuerpo))}
                          >
                            <Text style={styles.hash}>#</Text>
                            <Text style={[styles.texto, styles.flex]} numberOfLines={1}>
                              {c.name}
                            </Text>
                            {estado(c.id)}
                          </Pressable>
                        ))
                    : null}
                </View>
              ))}

            {pestana === 'dms' &&
              (conversaciones.length === 0 ? (
                <Text style={styles.meta}>Todavía no tenés conversaciones.</Text>
              ) : (
                conversaciones.map((c) => (
                  <Pressable
                    key={c.id}
                    style={styles.fila}
                    disabled={enviando !== null || enviados.has(c.id)}
                    onPress={() => enviar(c.id, () => enviarMensajeDirecto(c.id, cuerpo))}
                  >
                    <Avatar name={c.otherUser.name} url={c.otherUser.avatarUrl} size={30} />
                    <Text style={[styles.texto, styles.flex]} numberOfLines={1}>
                      {c.otherUser.name}
                    </Text>
                    {estado(c.id)}
                  </Pressable>
                ))
              ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  hoja: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
    maxHeight: '85%',
  },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  vista: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: spacing.md, gap: 2 },
  meta: { color: colors.mutedForeground, fontSize: fontSize.xs },
  texto: { color: colors.foreground, fontSize: fontSize.md },
  error: { color: colors.destructive, fontSize: fontSize.sm },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: radius.md, backgroundColor: colors.secondary },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  tabActiva: { backgroundColor: colors.background },
  tabTexto: { color: colors.mutedForeground, fontSize: fontSize.sm, fontWeight: '600' },
  tabTextoActivo: { color: colors.foreground },
  lista: { maxHeight: 380 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  canal: { paddingLeft: spacing.xl },
  hash: { color: colors.mutedForeground, fontSize: fontSize.lg, width: 30, textAlign: 'center' },
})
