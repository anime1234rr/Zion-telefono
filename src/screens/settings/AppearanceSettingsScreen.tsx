import { useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'

import { showAppAlert } from '@/hooks/use-app-alert'
import { useAuth } from '@/hooks/use-auth'
import { guardarFondo, useAppBackground } from '@/lib/app-background'
import { subirFondoApp } from '@/lib/storage'
import { getErrorMessage } from '@/lib/utils'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import { FilaAccion, Grupo, SettingsLayout, settingsStyles } from '@/screens/settings/settings-ui'
import { Segmentado, SelectorAcento, useCambiarApariencia } from '@/screens/settings/apariencia-opciones'

export function AppearanceSettingsScreen() {
  const { user } = useAuth()
  const fondo = useAppBackground()
  const [guardando, setGuardando] = useState(false)
  const { pref, cambiar } = useCambiarApariencia()

  async function elegir() {
    if (!user) return
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      videoMaxDuration: 30,
    })
    if (resultado.canceled || !resultado.assets[0]) return
    const asset = resultado.assets[0]
    setGuardando(true)
    try {
      const subido = await subirFondoApp(user.id, {
        uri: asset.uri,
        name: asset.fileName ?? `fondo.${asset.uri.split('.').pop()}`,
        type: asset.mimeType ?? (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        size: asset.fileSize,
      })
      await guardarFondo(user.id, subido)
    } catch (err) {
      showAppAlert('No se pudo cambiar el fondo', getErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  async function quitar() {
    if (!user) return
    setGuardando(true)
    try {
      await guardarFondo(user.id, null)
    } catch (err) {
      showAppAlert('No se pudo quitar el fondo', getErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <SettingsLayout
      titulo="Apariencia"
      descripcion="Elegí una imagen o un video como fondo de Zion. Se guarda en tu cuenta, así que también aparece en el escritorio."
    >
      <Grupo titulo="Fondo de la app">
        <View style={styles.vista}>
          {fondo?.tipo === 'imagen' ? (
            <Image source={{ uri: fondo.url }} style={styles.imagen} contentFit="cover" />
          ) : fondo?.tipo === 'video' ? (
            <View style={[styles.imagen, styles.centro]}>
              <Text style={styles.textoVista}>🎬 Video como fondo</Text>
            </View>
          ) : (
            <View style={[styles.imagen, styles.centro]}>
              <Text style={styles.textoVista}>Sin fondo personalizado</Text>
            </View>
          )}
          {guardando ? (
            <View style={[StyleSheet.absoluteFill, styles.centro, styles.cargando]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
        </View>
        <FilaAccion icono="images-outline" titulo={fondo ? 'Cambiar fondo' : 'Elegir fondo'} descripcion="Imagen o video de hasta 10 MB." onPress={guardando ? undefined : elegir} />
        {fondo ? <FilaAccion icono="trash-outline" titulo="Quitar fondo" peligro onPress={guardando ? undefined : quitar} /> : null}
      </Grupo>

      <Grupo titulo="Tema">
        <Segmentado
          opciones={[
            { valor: 'sistema', label: 'Sistema' },
            { valor: 'oscuro', label: 'Oscuro' },
            { valor: 'claro', label: 'Claro' },
          ]}
          valor={pref.tema}
          onChange={(v) => cambiar('tema', v)}
        />
      </Grupo>

      <Grupo titulo="Color de acento">
        <SelectorAcento valor={pref.acento} onChange={(v) => cambiar('acento', v)} />
      </Grupo>

      <Grupo titulo="Densidad">
        <Segmentado
          opciones={[
            { valor: 'compacta', label: 'Compacta' },
            { valor: 'normal', label: 'Normal' },
            { valor: 'comoda', label: 'Cómoda' },
          ]}
          valor={pref.densidad}
          onChange={(v) => cambiar('densidad', v)}
        />
      </Grupo>

      <Grupo titulo="Esquinas">
        <Segmentado
          opciones={[
            { valor: 'cuadrado', label: 'Cuadrado' },
            { valor: 'suave', label: 'Suave' },
            { valor: 'normal', label: 'Normal' },
            { valor: 'redondo', label: 'Redondo' },
          ]}
          valor={pref.esquinas}
          onChange={(v) => cambiar('esquinas', v)}
        />
      </Grupo>

      <Text style={settingsStyles.nota}>
        Si elegís un video como fondo, se pausa cuando activás "Reducir animaciones". Con el tema "Sistema", Zion cambia
        solo cuando tu teléfono pasa de claro a oscuro.
      </Text>
    </SettingsLayout>
  )
}

const styles = StyleSheet.create({
  vista: { padding: spacing.md },
  imagen: { width: '100%', height: 160, borderRadius: radius.md, backgroundColor: colors.secondary },
  centro: { alignItems: 'center', justifyContent: 'center' },
  textoVista: { color: colors.mutedForeground, fontSize: fontSize.sm },
  cargando: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: radius.md, margin: spacing.md },
})
