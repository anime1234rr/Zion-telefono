import { useEffect, useRef } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider } from '@/lib/auth-context'
import { RootNavigator } from '@/navigation/RootNavigator'
import { colors } from '@/theme/colors'
import { checkForUpdates } from '@/lib/updates'

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.primary,
  },
}

export default function App() {
  const appState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    checkForUpdates()

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkForUpdates()
      }
      appState.current = nextState
    })

    return () => subscription.remove()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
