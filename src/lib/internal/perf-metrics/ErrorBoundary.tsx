import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

import { formatErrorMessage } from '@/lib/internal/core-utils'
import { colors } from '@/theme/colors'
import { fontSize, radius, spacing } from '@/theme/theme'

interface Props {
  children: ReactNode
  label?: string
  fallbackMessage?: string
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[ErrorBoundary${this.props.label ? ` ${this.props.label}` : ''}]`, error, info.componentStack)
  }

  reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <View style={styles.container}>
        <Ionicons name="warning-outline" size={22} color={colors.destructive} />
        <Text style={styles.message}>{this.props.fallbackMessage ?? formatErrorMessage(error)}</Text>
        <Pressable style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonLabel}>Reintentar</Text>
        </Pressable>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },
  message: {
    color: colors.mutedForeground,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  buttonLabel: {
    color: colors.foreground,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
})
