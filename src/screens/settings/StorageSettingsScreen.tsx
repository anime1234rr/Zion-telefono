import { useCallback, useState } from 'react'
import { Text } from 'react-native'
import { Image } from 'expo-image'
import { useFocusEffect } from '@react-navigation/native'

import { showAppAlert } from '@/hooks/use-app-alert'
import { borrarClaves, clavesConPrefijo } from '@/lib/local-store'
import { FilaAccion, Grupo, SettingsLayout, settingsStyles } from '@/screens/settings/settings-ui'

export function StorageSettingsScreen() {
  const [chats, setChats] = useState(0)
  const [borradores, setBorradores] = useState(0)

  const contar = useCallback(() => {
    clavesConPrefijo('zion:msgcache:').then((c) => setChats(c.length))
    clavesConPrefijo('zion:draft:').then((c) => setBorradores(c.length))
  }, [])

  useFocusEffect(contar)

  function confirmar(titulo: string, mensaje: string, accion: () => Promise<void>) {
    showAppAlert(titulo, mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await accion()
          contar()
        },
      },
    ])
  }

  return (
    <SettingsLayout
      titulo="Almacenamiento y datos"
      descripcion="Zion guarda algunas cosas en el teléfono para cargar más rápido. Borrarlas no elimina nada de tu cuenta."
    >
      <Grupo titulo="Datos en este teléfono">
        <FilaAccion
          icono="chatbubbles-outline"
          titulo="Mensajes en caché"
          descripcion="Se vuelven a descargar al abrir cada chat."
          detalle={`${chats} chats`}
          onPress={() =>
            confirmar('Borrar caché de mensajes', '¿Borrar los mensajes guardados en este teléfono?', async () =>
              borrarClaves(await clavesConPrefijo('zion:msgcache:'))
            )
          }
        />
        <FilaAccion
          icono="create-outline"
          titulo="Borradores sin enviar"
          detalle={`${borradores}`}
          onPress={() =>
            confirmar('Borrar borradores', 'Se pierden los mensajes que empezaste a escribir y no enviaste.', async () =>
              borrarClaves(await clavesConPrefijo('zion:draft:'))
            )
          }
        />
        <FilaAccion
          icono="image-outline"
          titulo="Imágenes en caché"
          descripcion="Avatares, adjuntos y fondos descargados."
          onPress={() =>
            confirmar('Borrar imágenes en caché', 'Las imágenes se vuelven a descargar cuando las necesites.', async () => {
              await Promise.all([Image.clearDiskCache(), Image.clearMemoryCache()])
            })
          }
        />
      </Grupo>
      <Text style={settingsStyles.nota}>Los mensajes guardados y tus ajustes no se borran.</Text>
    </SettingsLayout>
  )
}
