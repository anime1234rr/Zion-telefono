import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/theme/colors'
import { useAppBackground } from '@/lib/app-background'

export function ScreenContainer({
  children,
  style,
  edges,
}: {
  children: ReactNode
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}) {
  const fondo = useAppBackground()
  return (
    <SafeAreaView
      style={[styles.container, fondo ? styles.transparente : null, style]}
      edges={edges ?? ['top', 'bottom']}
    >
      <View style={styles.inner}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  transparente: {
    backgroundColor: 'transparent',
  },
})
