import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState } from 'react-native'
import type { MediaStream } from 'react-native-webrtc'

import {
  actualizarEstadoVoz,
  iniciarHeartbeatVoz,
  listarParticipantesDeVoz,
  salirDeVoz,
  suscribirseAEstadosVoz,
  unirseAVoz,
  type VoiceParticipant,
} from '@/lib/voice'
import { crearMicStream, VoiceWebRtcSession } from '@/lib/voice-webrtc'

const ROSTER_POLL_MS = 8000

export interface VoiceSessionState {
  participants: VoiceParticipant[]
  muted: boolean
  deafened: boolean
  connecting: boolean
  error: string | null
  toggleMute: () => void
  toggleDeafen: () => void
}

export function useVoiceSession(canalId: string | null, userId: string | null): VoiceSessionState {
  const [participants, setParticipants] = useState<VoiceParticipant[]>([])
  const [muted, setMuted] = useState(false)
  const [deafened, setDeafened] = useState(false)
  const [connecting, setConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sessionRef = useRef<VoiceWebRtcSession | null>(null)
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map())
  const mutedRef = useRef(false)
  const deafenedRef = useRef(false)
  const [appActive, setAppActive] = useState(true)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppActive(nextState !== 'background')
    })
    return () => subscription.remove()
  }, [])

  const aplicar = useCallback(async (nextMuted: boolean, nextDeafened: boolean) => {
    mutedRef.current = nextMuted
    deafenedRef.current = nextDeafened
    setMuted(nextMuted)
    setDeafened(nextDeafened)
    sessionRef.current?.setMuted(nextMuted)
    for (const stream of remoteStreamsRef.current.values()) {
      for (const track of stream.getAudioTracks()) track.enabled = !nextDeafened
    }
    try {
      await actualizarEstadoVoz({ muted: nextMuted, deafened: nextDeafened })
    } catch (err) {
      console.error('No se pudo sincronizar el estado de voz', err)
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (deafenedRef.current) return
    void aplicar(!mutedRef.current, false)
  }, [aplicar])

  const toggleDeafen = useCallback(() => {
    const next = !deafenedRef.current
    void aplicar(next ? true : mutedRef.current, next)
  }, [aplicar])

  useEffect(() => {
    if (!canalId || !userId || !appActive) return
    let cancelled = false
    const remoteStreams = remoteStreamsRef.current
    let stopHeartbeat: (() => void) | null = null
    let stopRosterSub: (() => void) | null = null
    let pollHandle: ReturnType<typeof setInterval> | null = null

    async function refresh() {
      const session = sessionRef.current
      if (!session || cancelled) return
      try {
        const roster = await listarParticipantesDeVoz(canalId as string)
        if (cancelled) return
        const ids = new Set(roster.map((p) => p.user.id))
        for (const id of ids) if (id !== userId) session.ensurePeer(id)
        for (const id of [...remoteStreams.keys()]) {
          if (!ids.has(id)) {
            remoteStreams.delete(id)
            session.removePeer(id)
          }
        }
        setParticipants(roster)
      } catch (err) {
        console.error('No se pudo actualizar la sala de voz', err)
      }
    }

    async function start() {
      setConnecting(true)
      setError(null)
      try {
        const mic = await crearMicStream()
        if (cancelled) {
          for (const track of mic.getTracks()) track.stop()
          return
        }
        await unirseAVoz(canalId as string)
        const session = new VoiceWebRtcSession(canalId as string, userId as string, mic, {
          onRemoteStream: (id, stream) => {
            remoteStreams.set(id, stream)
            for (const track of stream.getAudioTracks()) track.enabled = !deafenedRef.current
          },
          onRemoteStreamEnded: (id) => {
            remoteStreams.delete(id)
          },
          onPeerClosed: (id) => {
            remoteStreams.delete(id)
          },
        })
        sessionRef.current = session
        session.setMuted(mutedRef.current)
        stopHeartbeat = iniciarHeartbeatVoz()
        stopRosterSub = suscribirseAEstadosVoz(canalId as string, () => void refresh())
        pollHandle = setInterval(() => void refresh(), ROSTER_POLL_MS)
        await refresh()
        if (!cancelled) setConnecting(false)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No se pudo conectar a la sala de voz.')
        setConnecting(false)
      }
    }

    void start()

    return () => {
      cancelled = true
      if (pollHandle) clearInterval(pollHandle)
      stopHeartbeat?.()
      stopRosterSub?.()
      remoteStreams.clear()
      sessionRef.current?.close()
      sessionRef.current = null
      salirDeVoz().catch(() => {})
    }
  }, [canalId, userId, appActive])

  return { participants, muted, deafened, connecting, error, toggleMute, toggleDeafen }
}
