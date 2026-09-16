import {
  MediaStream,
  mediaDevices,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc'

import { supabase } from '@/lib/supabase'

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

type SignalKind = 'offer' | 'answer' | 'ice'

interface SignalPayload {
  from: string
  to: string
  kind: SignalKind
  data: unknown
}

interface SdpLike {
  type: string | null
  sdp: string
}

interface IceCandidateLike {
  candidate?: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
}

interface PeerState {
  pc: RTCPeerConnection
  polite: boolean
  makingOffer: boolean
  ignoreOffer: boolean
}

export interface VoiceWebRtcCallbacks {
  onRemoteStream: (userId: string, stream: MediaStream) => void
  onRemoteStreamEnded: (userId: string) => void
  onPeerClosed: (userId: string) => void
}

export class VoiceWebRtcSession {
  private readonly userId: string
  private readonly callbacks: VoiceWebRtcCallbacks
  private readonly peers = new Map<string, PeerState>()
  private readonly channel: ReturnType<typeof supabase.channel>
  private micStream: MediaStream | null
  private closed = false

  constructor(
    canalId: string,
    userId: string,
    micStream: MediaStream,
    callbacks: VoiceWebRtcCallbacks
  ) {
    this.userId = userId
    this.micStream = micStream
    this.callbacks = callbacks
    this.channel = supabase
      .channel(`voz-senal-${canalId}`)
      .on('broadcast', { event: 'signal' }, ({ payload }) => {
        void this.handleSignal(payload as SignalPayload)
      })
    this.channel.subscribe()
  }

  ensurePeer(remoteUserId: string): void {
    if (this.closed || remoteUserId === this.userId || this.peers.has(remoteUserId)) return
    this.peers.set(remoteUserId, this.createPeer(remoteUserId))
  }

  removePeer(remoteUserId: string): void {
    const state = this.peers.get(remoteUserId)
    if (!state) return
    state.pc.close()
    this.peers.delete(remoteUserId)
    this.callbacks.onPeerClosed(remoteUserId)
  }

  setMuted(muted: boolean): void {
    if (!this.micStream) return
    for (const track of this.micStream.getAudioTracks()) track.enabled = !muted
  }

  close(): void {
    this.closed = true
    for (const [remoteUserId, state] of this.peers) {
      state.pc.close()
      this.callbacks.onPeerClosed(remoteUserId)
    }
    this.peers.clear()
    supabase.removeChannel(this.channel)
    if (this.micStream) {
      for (const track of this.micStream.getTracks()) track.stop()
    }
    this.micStream = null
  }

  private createPeer(remoteUserId: string): PeerState {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    const state: PeerState = {
      pc,
      polite: this.userId > remoteUserId,
      makingOffer: false,
      ignoreOffer: false,
    }

    if (this.micStream) {
      for (const track of this.micStream.getTracks()) pc.addTrack(track, this.micStream)
    }

    pc.addEventListener('icecandidate', (event) => {
      const c = event.candidate
      if (!c) return
      this.sendSignal(remoteUserId, 'ice', {
        candidate: c.candidate,
        sdpMid: c.sdpMid,
        sdpMLineIndex: c.sdpMLineIndex,
      })
    })

    pc.addEventListener('track', (event) => {
      const stream = event.streams[0]
      if (!stream) return
      this.callbacks.onRemoteStream(remoteUserId, stream)
      event.track?.addEventListener('ended', () => {
        this.callbacks.onRemoteStreamEnded(remoteUserId)
      })
    })

    pc.addEventListener('negotiationneeded', async () => {
      try {
        state.makingOffer = true
        await pc.setLocalDescription()
        this.sendSignal(remoteUserId, 'offer', { sdp: pc.localDescription })
      } catch (err) {
        console.error('No se pudo renegociar la conexion de voz', err)
      } finally {
        state.makingOffer = false
      }
    })

    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(remoteUserId)
      }
    })

    return state
  }

  private async handleSignal(payload: SignalPayload): Promise<void> {
    if (!payload || payload.to !== this.userId) return

    const remoteUserId = payload.from
    let state = this.peers.get(remoteUserId)
    if (!state) {
      state = this.createPeer(remoteUserId)
      this.peers.set(remoteUserId, state)
    }
    const { pc } = state

    try {
      if (payload.kind === 'offer' || payload.kind === 'answer') {
        const { sdp } = payload.data as { sdp: SdpLike }

        const offerCollision =
          sdp.type === 'offer' && (state.makingOffer || pc.signalingState !== 'stable')

        state.ignoreOffer = !state.polite && offerCollision
        if (state.ignoreOffer) return

        await pc.setRemoteDescription(new RTCSessionDescription({ type: sdp.type, sdp: sdp.sdp }))

        if (sdp.type === 'offer') {
          await pc.setLocalDescription()
          this.sendSignal(remoteUserId, 'answer', { sdp: pc.localDescription })
        }
      } else if (payload.kind === 'ice') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.data as IceCandidateLike))
        } catch (err) {
          if (!state.ignoreOffer) throw err
        }
      }
    } catch (err) {
      console.error('No se pudo procesar la senal de voz', err)
    }
  }

  private sendSignal(to: string, kind: SignalKind, data: unknown): void {
    const payload: SignalPayload = { from: this.userId, to, kind, data }
    void this.channel.send({ type: 'broadcast', event: 'signal', payload })
  }
}

export function crearMicStream(): Promise<MediaStream> {
  return mediaDevices.getUserMedia({ audio: true })
}
