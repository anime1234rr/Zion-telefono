import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { InicioScreen } from '@/screens/home/InicioScreen'
import { ServerListScreen } from '@/screens/servers/ServerListScreen'
import { ExploreScreen } from '@/screens/servers/ExploreScreen'
import type { MainTabParamList } from '@/navigation/types'
import { alfa, colors } from '@/theme/colors'
import { useAppBackground } from '@/lib/app-background'

const Tab = createBottomTabNavigator<MainTabParamList>()

export function MainTabs() {
  const fondo = useAppBackground()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: fondo ? { backgroundColor: 'transparent' } : undefined,
        tabBarStyle: {
          backgroundColor: fondo ? alfa(colors.background, 0.85) : colors.background,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={InicioScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Servidores"
        component={ServerListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="apps-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Explorar"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  )
}
