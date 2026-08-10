import { Alert, Linking, Platform } from 'react-native'
import * as Updates from 'expo-updates'
import * as Application from 'expo-application'
import * as FileSystem from 'expo-file-system/legacy'
import * as IntentLauncher from 'expo-intent-launcher'

import Constants from 'expo-constants'

const GITHUB_REPO = (Constants.expoConfig?.extra?.githubRepo as string) ?? 'anime1234rr/zion'
const RELEASE_TAG_PREFIX = (Constants.expoConfig?.extra?.mobileReleaseTagPrefix as string) ?? 'mobile-v'

type GithubAsset = {
  name: string
  browser_download_url: string
}

type GithubRelease = {
  tag_name: string
  assets: GithubAsset[]
}

function parseVersion(version: string): number[] {
  return version
    .replace(RELEASE_TAG_PREFIX, '')
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

export async function checkForOtaUpdate(): Promise<void> {
  if (__DEV__ || !Updates.isEnabled) return

  try {
    const result = await Updates.checkForUpdateAsync()
    if (!result.isAvailable) return

    await Updates.fetchUpdateAsync()

    Alert.alert('Actualización disponible', 'Zion se va a reiniciar para aplicar los últimos cambios.', [
      { text: 'Ahora', onPress: () => Updates.reloadAsync() },
      { text: 'Más tarde', style: 'cancel' },
    ])
  } catch {
    // Sin conexión o falla el chequeo: la app sigue con la versión actual, sin interrumpir al usuario.
  }
}

async function fetchLatestMobileRelease(): Promise<GithubRelease | null> {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`)
  if (!response.ok) return null

  const releases = (await response.json()) as GithubRelease[]
  return releases.find((release) => release.tag_name.startsWith(RELEASE_TAG_PREFIX)) ?? null
}

export async function checkForNativeUpdate(): Promise<void> {
  if (__DEV__ || Platform.OS !== 'android') return

  try {
    const release = await fetchLatestMobileRelease()
    if (!release) return

    const currentVersion = Application.nativeApplicationVersion ?? '0.0.0'
    if (!isNewer(release.tag_name, currentVersion)) return

    const apkAsset = release.assets.find((asset) => asset.name.endsWith('.apk'))
    if (!apkAsset) return

    Alert.alert(
      'Nueva versión de Zion',
      `Hay una versión nueva (${release.tag_name}) con cambios que requieren reinstalar la app. ¿Descargarla ahora?`,
      [
        { text: 'Descargar', onPress: () => downloadAndInstallApk(apkAsset.browser_download_url) },
        { text: 'Más tarde', style: 'cancel' },
      ],
    )
  } catch {
    // Sin conexión o falla el chequeo: no molestamos al usuario, se reintenta en el próximo inicio.
  }
}

async function downloadAndInstallApk(url: string): Promise<void> {
  try {
    const dest = `${FileSystem.cacheDirectory}zion-update.apk`
    const { uri } = await FileSystem.downloadAsync(url, dest)
    const contentUri = await FileSystem.getContentUriAsync(uri)

    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    })
  } catch {
    Alert.alert('No se pudo descargar la actualización', 'Probá de nuevo más tarde, o descargala manualmente.', [
      { text: 'Abrir GitHub', onPress: () => Linking.openURL(`https://github.com/${GITHUB_REPO}/releases`) },
      { text: 'Cerrar', style: 'cancel' },
    ])
  }
}

export async function checkForUpdates(): Promise<void> {
  await checkForOtaUpdate()
  await checkForNativeUpdate()
}
