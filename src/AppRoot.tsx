import { useEffect, useRef, useState } from 'react'
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
import { VoiceFloatingBar } from '@/components/VoiceFloatingBar'
import { useAppBackground } from '@/lib/app-background'
import { navigationRef } from '@/lib/navigation-ref'
import { checkForUpdates } from '@/lib/updates'

const RUTAS_SIN_BARRA_DE_VOZ = new Set(['VoiceChannel', 'VoiceChannelPlaceholder'])

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
  const [rutaActual, setRutaActual] = useState<string | undefined>(undefined)
  const theme = fondo
    ? { ...navigationTheme, colors: { ...navigationTheme.colors, background: 'transparent' } }
    : navigationTheme

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        theme={theme}
        onReady={() => setRutaActual(navigationRef.getCurrentRoute()?.name)}
        onStateChange={() => setRutaActual(navigationRef.getCurrentRoute()?.name)}
      >
        <StatusBar style={tema.claro ? 'dark' : 'light'} />
        <RootNavigator />
        <AppAlertHost />
      </NavigationContainer>
      <VoiceFloatingBar hidden={!!rutaActual && RUTAS_SIN_BARRA_DE_VOZ.has(rutaActual)} />
    </View>
  )
}
