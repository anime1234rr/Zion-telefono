import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { colors } from '@/theme/colors'

export function ScreenContainer({
  children,
  style,
  edges,
}: {
  children: ReactNode
  style?: ViewStyle
  edges?: ('top' | 'bottom' | 'left' | 'right')[]
}) {
  return (
    <SafeAreaView style={[styles.container, style]} edges={edges ?? ['top', 'bottom']}>
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
})
