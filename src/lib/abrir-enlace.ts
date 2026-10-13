import { navigationRef } from '@/lib/navigation-ref'
import { parseZionLink } from '@/lib/deep-links'
import { supabase } from '@/lib/supabase'

export async function abrirEnlaceZion(enlace: string | null | undefined, servidorId?: string | null): Promise<boolean> {
  if (!navigationRef.isReady()) return false
  const link = enlace ? parseZionLink(enlace) : null

  if (link?.type === 'dm-message') {
    navigationRef.navigate('DMChat', { conversationId: link.conversationId })
    return true
  }

  if (link?.type === 'invite') {
    navigationRef.navigate('CreateOrJoinServer')
    return true
  }

  if (link?.type === 'channel-message') {
    const { data } = await supabase
      .from('canales_servidor')
      .select('nombre, tipo, hilo_padre_id, bloqueado')
      .eq('id', link.channelId)
      .maybeSingle<{ nombre: string; tipo: string; hilo_padre_id: string | null; bloqueado: boolean | null }>()

    if (data?.hilo_padre_id) {
      navigationRef.navigate('ThreadChat', {
        serverId: link.serverId,
        threadId: link.channelId,
        threadName: data.nombre,
        locked: data.bloqueado ?? false,
      })
      return true
    }

    navigationRef.navigate('Channel', {
      serverId: link.serverId,
      channelId: link.channelId,
      channelName: data?.nombre ?? 'canal',
      highlightMessageId: link.messageId,
    })
    return true
  }

  if (servidorId) {
    navigationRef.navigate('ServerChannels', { serverId: servidorId })
    return true
  }

  navigationRef.navigate('Notifications')
  return true
}
