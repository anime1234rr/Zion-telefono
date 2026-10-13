import { useState } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'
import { TituloSeccion, conAlfa, staffStyles } from '@/screens/staff/staff-ui'

const REPO_URL = 'https://github.com/anime1234rr/Zion-telefono'
const STATUS_URL = 'https://zion.betteruptime.com/'

interface Enlace {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  descripcion: string
  url: string
  color: string
}

const ESTADO: Enlace[] = [
  { icon: 'pulse-outline', label: 'Estado del servicio', descripcion: 'Disponibilidad en vivo de Zion.', url: STATUS_URL, color: colors.online },
  {
    icon: 'construct-outline',
    label: 'Mantenimientos programados',
    descripcion: 'Ventanas de mantenimiento planificadas.',
    url: `${STATUS_URL}maintenance`,
    color: colors.idle,
  },
  {
    icon: 'warning-outline',
    label: 'Historial de incidentes',
    descripcion: 'Interrupciones e incidentes pasados del servicio.',
    url: `${STATUS_URL}incidents`,
    color: colors.dnd,
  },
]

const COMUNIDAD: Enlace[] = [
  {
    icon: 'logo-github',
    label: 'Repositorio y documentación',
    descripcion: 'Código fuente, README y guías del proyecto.',
    url: REPO_URL,
    color: colors.primary,
  },
  {
    icon: 'bug-outline',
    label: 'Reportar un error',
    descripcion: 'Abrí un issue en GitHub describiendo el problema.',
    url: `${REPO_URL}/issues/new`,
    color: colors.primary,
  },
]

const FAQ: { titulo: string; items: { pregunta: string; respuesta: string }[] }[] = [
  {
    titulo: 'Chats y mensajería',
    items: [
      {
        pregunta: '¿Qué puedo enviar en un chat?',
        respuesta:
          'Texto, fragmentos de código, imágenes y videos, stickers y emojis propios del servidor, reacciones y menciones con @usuario, @todos o @aquí.',
      },
      {
        pregunta: '¿Puedo responder, editar o eliminar mensajes?',
        respuesta:
          'Sí. Mantené apretado un mensaje para responderlo, reaccionar, editarlo o eliminarlo si es tuyo, fijarlo o crear un hilo. Los mensajes editados quedan marcados.',
      },
      {
        pregunta: '¿Cómo uso los comandos con "/"?',
        respuesta:
          'Si tenés permisos de moderación en el servidor, escribí "/" en el chat o tocá el rayo de la barra superior para ver los comandos: crear o editar roles, asignarlos, advertir, silenciar, expulsar, banear o limpiar mensajes.',
      },
      {
        pregunta: 'Me mencionaron, ¿cómo llego al mensaje?',
        respuesta:
          'Tocá la notificación en la campana y la app te lleva directo al canal y al mensaje exacto, resaltándolo un momento.',
      },
    ],
  },
  {
    titulo: 'Comunidades y servidores',
    items: [
      {
        pregunta: '¿Cómo encuentro servidores y personas?',
        respuesta:
          'En Explorar tenés dos categorías: Servidores, con las comunidades públicas y las destacadas por el equipo, y Personas, con quienes compartís un servidor, una amistad o un chat.',
      },
      {
        pregunta: '¿Puedo ver un servidor antes de crearlo?',
        respuesta:
          'Sí. Al crear un servidor elegí una plantilla y tocá "Ver el servidor por dentro" para recorrer sus canales antes de decidir.',
      },
      {
        pregunta: '¿Cómo modero a los miembros?',
        respuesta:
          'En la lista de miembros tocá los tres puntos (o mantené apretado a alguien) para cambiar su apodo, sus roles, silenciarlo, expulsarlo o banearlo, según tus permisos. Los baneados aparecen en su propia pestaña.',
      },
      {
        pregunta: '¿Los canales de voz tienen video?',
        respuesta:
          'Sí, podés activar la cámara, silenciarte o ensordecerte. En la lista de canales ves quién está conectado a cada canal de voz.',
      },
    ],
  },
  {
    titulo: 'Seguridad y cuenta',
    items: [
      {
        pregunta: '¿Cómo activo la verificación en dos pasos?',
        respuesta:
          'Desde Perfil › Seguridad. Es de la cuenta, no del dispositivo: cuando la activás, todos los dispositivos donde tengas la sesión abierta te piden el código.',
      },
      {
        pregunta: '¿Cómo reporto a alguien?',
        respuesta:
          'Abrí su perfil y tocá "Reportar usuario". Elegí el motivo, adjuntá como evidencia los mensajes reales que escribió y explicá qué pasó. No se aceptan capturas de pantalla y los reportes falsos tienen consecuencias.',
      },
      {
        pregunta: '¿Dónde veo si tengo una sanción?',
        respuesta:
          'En Perfil › Estado de mi cuenta ves cualquier advertencia o suspensión con su motivo, y el estado de los reportes que enviaste.',
      },
      {
        pregunta: 'Creo que una sanción es un error',
        respuesta:
          'Abrí un issue desde "Reportar un error" indicando tu nombre de usuario y por qué creés que hubo un error. El equipo revisa cada caso.',
      },
    ],
  },
]

export function HelpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [abierta, setAbierta] = useState<string | null>(null)

  return (
    <ScreenContainer>
      <View style={staffStyles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={staffStyles.headerTitulo}>Ayuda y soporte</Text>
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <TituloSeccion>Estado del servicio</TituloSeccion>
        {ESTADO.map((e) => (
          <EnlaceFila key={e.url} enlace={e} />
        ))}

        <TituloSeccion>Comunidad y soporte</TituloSeccion>
        {COMUNIDAD.map((e) => (
          <EnlaceFila key={e.url} enlace={e} />
        ))}

        {FAQ.map((categoria) => (
          <View key={categoria.titulo} style={styles.categoria}>
            <TituloSeccion>{categoria.titulo}</TituloSeccion>
            {categoria.items.map((item) => {
              const activa = abierta === item.pregunta
              return (
                <Pressable
                  key={item.pregunta}
                  style={staffStyles.card}
                  onPress={() => setAbierta(activa ? null : item.pregunta)}
                >
                  <View style={styles.pregunta}>
                    <Text style={[staffStyles.nombre, styles.flex]}>{item.pregunta}</Text>
                    <Ionicons name={activa ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
                  </View>
                  {activa ? <Text style={staffStyles.texto}>{item.respuesta}</Text> : null}
                </Pressable>
              )
            })}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  )
}

function EnlaceFila({ enlace }: { enlace: Enlace }) {
  return (
    <Pressable style={[staffStyles.card, staffStyles.fila]} onPress={() => Linking.openURL(enlace.url)}>
      <View style={[styles.icono, { backgroundColor: conAlfa(enlace.color, 0.12) }]}>
        <Ionicons name={enlace.icon} size={18} color={enlace.color} />
      </View>
      <View style={styles.flex}>
        <Text style={staffStyles.nombre}>{enlace.label}</Text>
        <Text style={staffStyles.meta}>{enlace.descripcion}</Text>
      </View>
      <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contenido: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.xxl },
  categoria: { gap: spacing.sm },
  pregunta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icono: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  textoChico: { fontSize: fontSize.xs },
})
