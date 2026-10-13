import { useEffect, useRef } from 'react'
import { AppState, Appearance, View, type AppStateStatus } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider } from '@/lib/auth-context'
import { aparienciaActual, recargarApp } from '@/theme/apariencia'
import { colors, tema } from '@/theme/colors'
import { RootNavigator } from '@/navigation/RootNavigator'
import { AppAlertHost } from '@/components/AppAlertHost'
import { AppBackgroundLayer } from '@/components/AppBackgroundLayer'
import { useAppBackground } from '@/lib/app-background'
import { navigationRef } from '@/lib/navigation-ref'
import { checkForUpdates } from '@/lib/updates'

const base = tema.claro ? DefaultTheme : DarkTheme

const navigationTheme = {
  ...base,
  colors: {
    ...base.colors,
    background: colors.background,
    card: colors.card,
    text: colors.foreground,
    border: colors.border,
    primary: colors.primary,
  },
}

export function AppRoot() {
  const appState = useRef<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    checkForUpdates()

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        checkForUpdates()
      }
      appState.current = nextState
    })

    const temaSub = Appearance.addChangeListener(() => {
      if (aparienciaActual().tema === 'sistema') recargarApp()
    })

    return () => {
      subscription.remove()
      temaSub.remove()
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppBackgroundLayer />
          <Navegacion />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

function Navegacion() {
  const fondo = useAppBackground()
  const theme = fondo
    ? { ...navigationTheme, colors: { ...navigationTheme.colors, background: 'transparent' } }
    : navigationTheme

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef} theme={theme}>
        <StatusBar style={tema.claro ? 'dark' : 'light'} />
        <RootNavigator />
        <AppAlertHost />
      </NavigationContainer>
    </View>
  )
}
