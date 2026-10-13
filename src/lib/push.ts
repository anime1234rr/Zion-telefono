import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

import { supabase } from '@/lib/supabase'
import { leerJSON, escribirJSON } from '@/lib/local-store'

const CLAVE_ACTIVAS = 'zion:push-activas'
const CLAVE_TOKEN = 'zion:push-token'

export type EstadoPermisoPush = 'concedido' | 'denegado' | 'sin-preguntar' | 'no-disponible'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function crearCanalesAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('mensajes', {
    name: 'Mensajes y menciones',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 120, 200],
    lightColor: '#6366f1',
  })
  await Notifications.setNotificationChannelAsync('social', {
    name: 'Solicitudes de amistad',
    importance: Notifications.AndroidImportance.DEFAULT,
  })
  await Notifications.setNotificationChannelAsync('general', {
    name: 'Avisos de Zion y servidores',
    importance: Notifications.AndroidImportance.DEFAULT,
  })
}

export async function pushActivas(): Promise<boolean> {
  return leerJSON<boolean>(CLAVE_ACTIVAS, true)
}

export async function estadoPermisoPush(): Promise<EstadoPermisoPush> {
  if (!Device.isDevice) return 'no-disponible'
  const { status, canAskAgain } = await Notifications.getPermissionsAsync()
  if (status === 'granted') return 'concedido'
  if (status === 'denied' && !canAskAgain) return 'denegado'
  return 'sin-preguntar'
}

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId
  )
}

let registrandoEnCurso: Promise<EstadoPermisoPush> | null = null

export function registrarPush(preguntar: boolean): Promise<EstadoPermisoPush> {
  if (registrandoEnCurso) return registrandoEnCurso
  registrandoEnCurso = registrarPushInterno(preguntar).finally(() => {
    registrandoEnCurso = null
  })
  return registrandoEnCurso
}

async function registrarPushInterno(preguntar: boolean): Promise<EstadoPermisoPush> {
  if (!Device.isDevice) return 'no-disponible'
  await crearCanalesAndroid()

  let estado = await estadoPermisoPush()
  if (estado === 'sin-preguntar' && preguntar) {
    const { status } = await Notifications.requestPermissionsAsync()
    estado = status === 'granted' ? 'concedido' : 'denegado'
  }
  if (estado !== 'concedido') return estado

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: projectId() })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const claveActual = `${user?.id ?? ''}:${token}`
  const claveGuardada = await leerJSON<string | null>(CLAVE_TOKEN, null)
  if (claveActual === claveGuardada) return 'concedido'

  const { error } = await supabase.rpc('registrar_push_token', {
    p_token: token,
    p_plataforma: Platform.OS === 'ios' ? 'ios' : 'android',
  })
  if (error) throw error
  await escribirJSON(CLAVE_TOKEN, claveActual)
  return 'concedido'
}

export async function desregistrarPush(): Promise<void> {
  const claveGuardada = await leerJSON<string | null>(CLAVE_TOKEN, null)
  if (!claveGuardada) return
  const token = claveGuardada.slice(claveGuardada.indexOf(':') + 1)
  await supabase.rpc('quitar_push_token', { p_token: token })
  await escribirJSON(CLAVE_TOKEN, null)
}

export async function cambiarPushActivas(activas: boolean): Promise<EstadoPermisoPush> {
  await escribirJSON(CLAVE_ACTIVAS, activas)
  if (!activas) {
    await desregistrarPush()
    return estadoPermisoPush()
  }
  return registrarPush(true)
}

export async function actualizarInsignia(cantidad: number): Promise<void> {
  await Notifications.setBadgeCountAsync(Math.max(0, cantidad)).catch(() => false)
}

export async function enviarNotificacionDePrueba(): Promise<void> {
  await crearCanalesAndroid()
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Notificaciones activadas',
      body: 'Así te van a llegar las menciones y los mensajes de Zion.',
      sound: 'default',
    },
    trigger: Platform.OS === 'android' ? { channelId: 'general', seconds: 1, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL } : null,
  })
}
