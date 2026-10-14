import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import type { MediaStream } from 'react-native-webrtc'

import { getErrorMessage } from '@/lib/utils'
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

export interface VoiceConnectionState {
  connectedChannelId: string | null
  connectedChannelName: string | null
  connecting: boolean
  participants: VoiceParticipant[]
  muted: boolean
  deafened: boolean
  error: string | null
}

type Listener = (state: VoiceConnectionState) => void

let state: VoiceConnectionState = {
  connectedChannelId: null,
  connectedChannelName: null,
  connecting: false,
  participants: [],
  muted: false,
  deafened: false,
  error: null,
}

const listeners = new Set<Listener>()

let session: VoiceWebRtcSession | null = null
const remoteStreams = new Map<string, MediaStream>()
let stopHeartbeat: (() => void) | null = null
let stopRosterSub: (() => void) | null = null
let pollHandle: ReturnType<typeof setInterval> | null = null
let currentUserId: string | null = null

const ROSTER_POLL_MS = 8000

function setState(patch: Partial<VoiceConnectionState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener(state)
}

async function refreshRoster(canalId: string) {
  if (!session) return
  try {
    const roster = await listarParticipantesDeVoz(canalId)
    const ids = new Set(roster.map((p) => p.user.id))
    for (const id of ids) if (id !== currentUserId) session.ensurePeer(id)
    for (const id of [...remoteStreams.keys()]) {
      if (!ids.has(id)) {
        remoteStreams.delete(id)
        session.removePeer(id)
      }
    }
    setState({ participants: roster })
  } catch (err) {
    console.error('No se pudo actualizar la sala de voz', err)
  }
}

export async function joinVoiceChannel(
  canalId: string,
  userId: string,
  channelName: string
): Promise<void> {
  if (state.connectedChannelId === canalId) return
  if (state.connectedChannelId) await leaveVoiceChannel()

  setState({ connecting: true, error: null, connectedChannelName: channelName })
  currentUserId = userId

  try {
    const mic = await crearMicStream()
    await unirseAVoz(canalId)

    session = new VoiceWebRtcSession(canalId, userId, mic, {
      onRemoteStream: (id, stream) => {
        remoteStreams.set(id, stream)
        for (const track of stream.getAudioTracks()) track.enabled = !state.deafened
      },
      onRemoteStreamEnded: (id) => {
        remoteStreams.delete(id)
      },
      onPeerClosed: (id) => {
        remoteStreams.delete(id)
      },
    })
    session.setMuted(state.muted)
    stopHeartbeat = iniciarHeartbeatVoz()
    stopRosterSub = suscribirseAEstadosVoz(canalId, () => void refreshRoster(canalId))
    pollHandle = setInterval(() => void refreshRoster(canalId), ROSTER_POLL_MS)

    await refreshRoster(canalId)
    setState({ connectedChannelId: canalId, connecting: false })
  } catch (err) {
    setState({
      connecting: false,
      error: getErrorMessage(err),
      connectedChannelName: null,
    })
    session?.close()
    session = null
    currentUserId = null
  }
}

export async function leaveVoiceChannel(): Promise<void> {
  if (!state.connectedChannelId) return

  if (pollHandle) clearInterval(pollHandle)
  pollHandle = null
  stopHeartbeat?.()
  stopHeartbeat = null
  stopRosterSub?.()
  stopRosterSub = null
  remoteStreams.clear()
  session?.close()
  session = null
  currentUserId = null

  setState({
    connectedChannelId: null,
    connectedChannelName: null,
    participants: [],
    muted: false,
    deafened: false,
  })

  try {
    await salirDeVoz()
  } catch (err) {
    console.error('No se pudo notificar la desconexión del canal de voz', err)
  }
}

export async function toggleMute(): Promise<void> {
  if (state.deafened) return
  const next = !state.muted
  setState({ muted: next })
  session?.setMuted(next)
  if (state.connectedChannelId) {
    try {
      await actualizarEstadoVoz({ muted: next })
    } catch (err) {
      console.error('No se pudo sincronizar el silenciado', err)
    }
  }
}

export async function toggleDeafen(): Promise<void> {
  const next = !state.deafened
  const nextMuted = next ? true : state.muted
  setState({ deafened: next, muted: nextMuted })
  session?.setMuted(nextMuted)
  for (const stream of remoteStreams.values()) {
    for (const track of stream.getAudioTracks()) track.enabled = !next
  }
  if (state.connectedChannelId) {
    try {
      await actualizarEstadoVoz({ muted: nextMuted, deafened: next })
    } catch (err) {
      console.error('No se pudo sincronizar el ensordecido', err)
    }
  }
}

export function useVoiceConnection(): VoiceConnectionState {
  const [snapshot, setSnapshot] = useState(state)

  useEffect(() => {
    listeners.add(setSnapshot)
    return () => {
      listeners.delete(setSnapshot)
    }
  }, [])

  return snapshot
}

AppState.addEventListener('change', (nextState) => {
  if (nextState === 'background' && state.connectedChannelId) {
    leaveVoiceChannel().catch((err) => console.error('No se pudo salir de voz al pasar a segundo plano', err))
  }
})
