import { Linking, Platform } from 'react-native'
import * as Updates from 'expo-updates'
import * as Application from 'expo-application'
import * as FileSystem from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'
import Constants from 'expo-constants'

import { showAppAlert } from '@/hooks/use-app-alert'
import { escribirTexto, leerTexto } from '@/lib/local-store'

const ZION_WEB_URL = (Constants.expoConfig?.extra?.webBaseUrl as string) ?? 'https://zionq.netlify.app'

export const APP_VERSION =
  Application.nativeApplicationVersion ?? (Constants.expoConfig?.version as string) ?? '0.0.0'

const K_LAST_CHECK = 'zion:update:last-check'
const K_APK_DISMISSED = 'zion:update:apk-dismissed'
const K_OTA_DISMISSED = 'zion:update:ota-dismissed'
const THROTTLE_MS = 3 * 60 * 60 * 1000

type WebVersionResponse = {
  version: string
  releaseNotes?: string
  releaseDate?: string | null
}

type CheckOptions = { manual?: boolean }

function parseVersion(version: string): number[] {
  return version
    .replace(/^v/, '')
    .split('.')
    .map((part) => parseInt(part, 10) || 0)
}

function isNewer(remote: string, local: string): boolean {
  const remoteParts = parseVersion(remote)
  const localParts = parseVersion(local)
  for (let i = 0; i < Math.max(remoteParts.length, localParts.length); i++) {
    const r = remoteParts[i] ?? 0
    const l = localParts[i] ?? 0
    if (r !== l) return r > l
  }
  return false
}

function recortarNotas(body: string | undefined, max = 600): string {
  if (!body) return ''
  const limpio = body.replace(/\r/g, '').trim()
  return limpio.length <= max ? limpio : `${limpio.slice(0, max).trimEnd()}…`
}

export async function checkForUpdates(options: CheckOptions = {}): Promise<void> {
  const manual = options.manual === true

  if (__DEV__) {
    if (manual) {
      showAppAlert('Actualizaciones', 'La búsqueda de actualizaciones no está disponible en modo desarrollo.')
    }
    return
  }

  if (!manual) {
    const last = Number((await leerTexto(K_LAST_CHECK)) ?? '0')
    if (Date.now() - last < THROTTLE_MS) return
  }
  await escribirTexto(K_LAST_CHECK, String(Date.now()))

  const otaOffered = await checkForOtaUpdate(manual)
  const nativeOffered = otaOffered ? false : await checkForNativeUpdate(manual)

  if (manual && !otaOffered && !nativeOffered) {
    showAppAlert('Todo al día', `Ya tenés la última versión de Zion (${APP_VERSION}).`)
  }
}

async function checkForOtaUpdate(manual: boolean): Promise<boolean> {
  if (!Updates.isEnabled) return false

  try {
    const result = await Updates.checkForUpdateAsync()
    if (!result.isAvailable) return false

    const id = (result.manifest as { id?: string } | undefined)?.id ?? 'ota'
    if (!manual && (await leerTexto(K_OTA_DISMISSED)) === id) return true

    await Updates.fetchUpdateAsync()

    showAppAlert(
      'Actualización lista',
      'Descargamos los últimos cambios. Zion se reinicia para aplicarlos.',
      [
        {
          text: 'Más tarde',
          style: 'cancel',
          onPress: () => {
            void escribirTexto(K_OTA_DISMISSED, id)
          },
        },
        { text: 'Reiniciar ahora', onPress: () => Updates.reloadAsync() },
      ]
    )
    return true
  } catch {
    if (manual) {
      showAppAlert('No se pudo comprobar', 'Revisá tu conexión e intentá de nuevo.')
    }
    return false
  }
}

async function fetchLatestMobileVersion(): Promise<WebVersionResponse | null> {
  const response = await fetch(`${ZION_WEB_URL}/api/version/android`)
  if (!response.ok) return null
  return (await response.json()) as WebVersionResponse
}

async function checkForNativeUpdate(manual: boolean): Promise<boolean> {
  if (Platform.OS !== 'android') return false

  try {
    const release = await fetchLatestMobileVersion()
    if (!release) return false
    if (!isNewer(release.version, APP_VERSION)) return false

    if (!manual && (await leerTexto(K_APK_DISMISSED)) === release.version) return true

    const notas = recortarNotas(release.releaseNotes)

    showAppAlert(
      `Zion ${release.version} disponible`,
      notas
        ? `Novedades:\n\n${notas}\n\nEsta versión trae cambios que requieren actualizar la app.`
        : 'Hay una versión nueva con cambios que requieren actualizar la app.',
      [
        {
          text: 'Más tarde',
          style: 'cancel',
          onPress: () => {
            void escribirTexto(K_APK_DISMISSED, release.version)
          },
        },
        { text: 'Descargar', onPress: () => downloadAndInstallApk(`${ZION_WEB_URL}/api/download/android`) },
      ]
    )
    return true
  } catch {
    if (manual) {
      showAppAlert('No se pudo comprobar', 'Revisá tu conexión e intentá de nuevo.')
    }
    return false
  }
}

async function downloadAndInstallApk(url: string): Promise<void> {
  try {
    const dest = `${FileSystem.cacheDirectory}zion-update.apk`
    const { uri } = await FileSystem.downloadAsync(url, dest)
    const contentUri = await FileSystem.getContentUriAsync(uri)

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1,
      type: 'application/vnd.android.package-archive',
    })
  } catch {
    showAppAlert('No se pudo descargar la actualización', 'Probá de nuevo más tarde, o descargala manualmente.', [
      { text: 'Cerrar', style: 'cancel' },
      { text: 'Abrir web', onPress: () => Linking.openURL(`${ZION_WEB_URL}/download`) },
    ])
  }
}
