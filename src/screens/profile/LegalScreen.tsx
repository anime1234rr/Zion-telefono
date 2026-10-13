import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { ScreenContainer } from '@/components/ScreenContainer'
import { PRIVACIDAD, TERMINOS } from '@/lib/legal-content'
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
  const documento = tab === 'terminos' ? TERMINOS : PRIVACIDAD

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

      <ScrollView key={tab} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Última actualización: {documento.actualizado}.</Text>

        {documento.intro.map((parrafo) => (
          <Parrafo key={parrafo}>{parrafo}</Parrafo>
        ))}

        {documento.secciones.map((seccion, index) => (
          <Seccion key={seccion.id} titulo={`${index + 1}. ${seccion.titulo}`}>
            {seccion.bloques.map((bloque, i) =>
              bloque.tipo === 'p' ? (
                <Parrafo key={i}>{bloque.texto}</Parrafo>
              ) : (
                <View key={i} style={styles.lista}>
                  {bloque.items.map((item) => (
                    <Item key={item}>{item}</Item>
                  ))}
                </View>
              )
            )}
          </Seccion>
        ))}
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
  lista: { gap: spacing.xs },
  item: { flexDirection: 'row', gap: spacing.xs, paddingLeft: spacing.xs },
  itemBullet: { color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
  itemText: { flex: 1, color: colors.mutedForeground, fontSize: fontSize.sm, lineHeight: 19 },
})
