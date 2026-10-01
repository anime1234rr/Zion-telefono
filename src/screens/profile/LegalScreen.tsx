import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import type { RootStackParamList } from '@/navigation/types'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

type Tab = 'terminos' | 'privacidad'

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>{titulo}</Text>
      {children}
    </View>
  )
}

function Parrafo({ children }: { children: React.ReactNode }) {
  return <Text style={styles.parrafo}>{children}</Text>
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.item}>
      <Text style={styles.itemBullet}>{'•'}</Text>
      <Text style={styles.itemText}>{children}</Text>
    </View>
  )
}

export function LegalScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const [tab, setTab] = useState<Tab>('terminos')

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Términos y Privacidad</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabButton, tab === 'terminos' && styles.tabButtonActive]}
          onPress={() => setTab('terminos')}
        >
          <Text style={[styles.tabLabel, tab === 'terminos' && styles.tabLabelActive]}>Términos</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === 'privacidad' && styles.tabButtonActive]}
          onPress={() => setTab('privacidad')}
        >
          <Text style={[styles.tabLabel, tab === 'privacidad' && styles.tabLabelActive]}>Privacidad</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Última actualización: 1 de octubre de 2026.</Text>

        {tab === 'terminos' ? (
          <>
            <Parrafo>
              Estos términos rigen el uso de Zion — la app de escritorio, la app móvil y la web — para
              cualquier persona que cree una cuenta o use el servicio. Es el mismo acuerdo para las tres
              plataformas: es la misma cuenta y el mismo servicio.
            </Parrafo>

            <Seccion titulo="Tu cuenta">
              <Parrafo>
                Tu cuenta es personal e intransferible. Sos responsable de mantener la confidencialidad de
                tu contraseña y de toda actividad que ocurra bajo tu cuenta. Es la misma cuenta en
                escritorio, móvil y la web.
              </Parrafo>
            </Seccion>

            <Seccion titulo="Uso aceptable y conducta">
              <Parrafo>Al usar Zion, te comprometés a no:</Parrafo>
              <Item>Publicar contenido ilegal o que infrinja los derechos de terceros.</Item>
              <Item>Acosar, amenazar o intimidar a otras personas usuarias.</Item>
              <Item>Suplantar la identidad de otra persona, servidor o del equipo de Zion.</Item>
              <Item>
                Automatizar acciones por fuera del sistema oficial de Apps y Webhooks — bots o clientes
                modificados no están permitidos.
              </Item>
              <Item>Intentar eludir la moderación, los baneos o el motor de permisos de un servidor.</Item>
            </Seccion>

            <Seccion titulo="Contenido que generás">
              <Parrafo>
                Mantenés la titularidad de los mensajes, imágenes y demás contenido que subís. Al
                publicarlo, nos das el permiso técnico para almacenarlo, sincronizarlo entre tus
                dispositivos y mostrarlo según los permisos del servidor donde lo publicaste.
              </Parrafo>
            </Seccion>

            <Seccion titulo="Propiedad intelectual">
              <Parrafo>
                Zion, su logotipo, su nombre y el diseño de sus apps y su web son propiedad de
                @anime1234rr. El código fuente, los binarios y los assets son de código propietario: no
                pueden copiarse, redistribuirse ni modificarse por fuera de las herramientas oficiales.
              </Parrafo>
            </Seccion>

            <Seccion titulo="Cambios al servicio y cierre de cuentas">
              <Parrafo>
                Zion está en desarrollo activo: podemos agregar, modificar o discontinuar funcionalidades
                en cualquier momento. Podemos suspender o cerrar tu cuenta si incumplís estos términos. Vos
                también podés cerrar tu cuenta cuando quieras desde esta pantalla.
              </Parrafo>
            </Seccion>

            <Seccion titulo="Limitación de responsabilidad">
              <Parrafo>
                Zion se ofrece "tal cual" y "según disponibilidad", sin garantías de disponibilidad
                continua. Usás Zion bajo tu propio riesgo; en la medida permitida por la ley, no somos
                responsables por daños derivados del uso del servicio.
              </Parrafo>
            </Seccion>

            <Text style={styles.nota}>
              Esta es una versión resumida. La versión completa, con todas las cláusulas, está disponible
              en la sección de Términos de servicio de nuestra web.
            </Text>
          </>
        ) : (
          <>
            <Parrafo>
              Esta política explica qué información maneja Zion en escritorio, móvil y la web, para qué la
              usamos y qué control tenés sobre ella. Es la misma cuenta y los mismos datos en las tres
              plataformas.
            </Parrafo>

            <Seccion titulo="Información que recopilamos">
              <Item>Credenciales de acceso: tu correo y tu contraseña (o solo tu correo, con link mágico).</Item>
              <Item>
                Datos de perfil: nombre de usuario, nombre visible, biografía, avatar y tu estado de
                presencia — todo lo que configurás vos mismo.
              </Item>
              <Item>
                Contenido de uso: mensajes, servidores, roles y archivos, necesarios para sincronizarlos
                entre tus dispositivos.
              </Item>
            </Seccion>

            <Seccion titulo="Cómo usamos tu información">
              <Parrafo>
                Exclusivamente para autenticarte, sincronizar tus comunidades entre dispositivos, mostrar
                tu perfil y presencia a quienes compartís un servidor, y mantener la seguridad del
                servicio. No usamos tu información para publicidad ni la vendemos.
              </Parrafo>
            </Seccion>

            <Seccion titulo="Con quién la compartimos">
              <Parrafo>
                Tu perfil público es visible para quienes compartan un servidor con vos. Tus mensajes
                directos solo son visibles para quienes participan en ellos. No compartimos ni vendemos tu
                información a terceros.
              </Parrafo>
            </Seccion>

            <Seccion titulo="Seguridad de los datos">
              <Parrafo>
                Toda la información viaja cifrada entre tu celular y nuestros servidores. Tu contraseña
                nunca se guarda en texto plano. El acceso a tus datos está restringido por los permisos de
                cada servidor y de tu cuenta.
              </Parrafo>
            </Seccion>

            <Seccion titulo="Tus derechos">
              <Parrafo>
                Podés ver y editar tu perfil, cambiar tu correo o contraseña, y pedir la eliminación
                completa de tu cuenta y tus datos — todo desde Seguridad, en esta misma app.
              </Parrafo>
            </Seccion>

            <Text style={styles.nota}>
              Esta es una versión resumida. La versión completa, con todas las cláusulas, está disponible
              en la sección de Privacidad de nuestra web.
            </Text>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { color: colors.foreground, fontSize: fontSize.lg, fontWeight: '700' },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.muted,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  tabButtonActive: { backgroundColor: colors.background },
  tabLabel: { color: colors.mutedForeground, fontSize: fontSize.sm, fontWeight: '600' },
  tabLabelActive: { color: colors.foreground },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  intro: { color: colors.mutedForeground, fontSize: fontSize.xs },
  seccion: { gap: spacing.sm },
  seccionTitulo: { color: colors.foreground, fontSize: fontSize.md, fontWeight: '600' },
  parrafo: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  item: { flexDirection: 'row', gap: spacing.xs, paddingLeft: spacing.xs },
  itemBullet: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  itemText: { flex: 1, color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  nota: { color: colors.mutedForeground, fontSize: fontSize.xs, fontStyle: 'italic' },
})
